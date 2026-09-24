"""Upload and verify local site media in the user's Cloudflare R2 bucket.

Credentials are read only from ../Cloudflare_API.txt and never printed or saved.
The site retains local media copies so annotations can be regenerated offline.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import mimetypes
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

import boto3
from boto3.s3.transfer import TransferConfig
from botocore.config import Config
from botocore.exceptions import ClientError


ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "site"
MEDIA_PREFIXES = ("assets/media/", "assets/compare/", "assets/carriages/", "assets/carriages-q4809/")


def public_base(site_root: Path) -> str:
    value = json.loads((site_root / "media-config.json").read_text(encoding="utf-8"))["publicBaseUrl"]
    host = urlsplit(value)
    if host.scheme != "https" or not host.hostname or not host.hostname.endswith(".r2.dev") or host.path:
        raise ValueError("Invalid public R2 URL in media-config.json")
    return value.rstrip("/")

BUCKET = "etrac-media"
STATE = SITE / ".r2-upload-state.json"
DIRECTORIES = tuple(SITE / prefix.rstrip("/") for prefix in MEDIA_PREFIXES)
TRANSFER = TransferConfig(multipart_threshold=64 * 1024 * 1024, multipart_chunksize=16 * 1024 * 1024,
                          max_concurrency=2, use_threads=True)


def connection():
    lines = (ROOT / "Cloudflare_API.txt").read_text(encoding="utf-8-sig").splitlines()
    # The user's credential sheet supplies labelled values in this order.
    key_id, secret, endpoint = lines[4].strip(), lines[7].strip(), lines[10].strip()
    public = lines[12].partition("=")[2].strip().rstrip("/")
    host = urlsplit(endpoint)
    if not key_id or not secret or host.scheme != "https" or not host.hostname or not host.hostname.endswith(".r2.cloudflarestorage.com"):
        raise ValueError("Cloudflare_API.txt has no valid R2 S3 connection details")
    if public != public_base(SITE):
        raise ValueError("Public R2 URL differs from the site's media config")
    return boto3.client("s3", endpoint_url=endpoint, aws_access_key_id=key_id,
                        aws_secret_access_key=secret, region_name="auto",
                        config=Config(retries={"max_attempts": 10, "mode": "standard"},
                                      connect_timeout=30, read_timeout=120)), public


def files():
    found = []
    for directory in DIRECTORIES:
        if directory.exists():
            found.extend(path for path in directory.rglob("*") if path.is_file())
    return sorted(found)


def key_for(path: Path) -> str:
    return path.relative_to(SITE).as_posix()


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def verified_head(client, path: Path, checksum: str) -> bool:
    try:
        head = client.head_object(Bucket=BUCKET, Key=key_for(path))
    except ClientError as error:
        if error.response.get("ResponseMetadata", {}).get("HTTPStatusCode") == 404:
            return False
        raise
    return head["ContentLength"] == path.stat().st_size and head.get("Metadata", {}).get("sha256") == checksum


def upload_one(client, path: Path) -> str:
    checksum = digest(path)
    if verified_head(client, path, checksum):
        return "already verified"
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    client.upload_file(str(path), BUCKET, key_for(path),
                       ExtraArgs={"ContentType": mime, "Metadata": {"sha256": checksum}},
                       Config=TRANSFER)
    if not verified_head(client, path, checksum):
        raise RuntimeError(f"R2 upload verification failed: {key_for(path)}")
    return "uploaded"


def save_state(entries: dict) -> None:
    temporary = STATE.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(entries, separators=(",", ":")), encoding="utf-8")
    temporary.replace(STATE)


def sync_one(client, path: Path, previous: dict) -> tuple[str, str]:
    key = key_for(path)
    stat = path.stat()
    old = previous.get(key)
    if old and old[:2] == [stat.st_size, stat.st_mtime_ns]:
        return "unchanged", old[2]
    checksum = digest(path)
    if old and old[2] == checksum:
        return "unchanged", checksum
    return upload_one(client, path), checksum


def public_probe(public: str, paths: list[Path]) -> None:
    samples = (("assets/media/", ".jpg"), ("assets/media/", ".mp4"),
               ("assets/carriages/", ".jpg"), ("assets/compare/", ".jpg"))
    for prefix, suffix in samples:
        path = next((item for item in paths if key_for(item).startswith(prefix) and item.suffix.lower() == suffix), None)
        if not path:
            continue
        request = Request(public + "/" + key_for(path), headers={
            "Range": "bytes=0-63",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36",
        })
        with urlopen(request, timeout=30) as response:
            if response.status not in (200, 206) or not response.read(64):
                raise RuntimeError(f"Public URL failed: {key_for(path)}")
        print(f"Public media check passed: {key_for(path)}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("inventory", "upload", "verify", "probe", "sync"))
    args = parser.parse_args()
    paths = files()
    total = sum(path.stat().st_size for path in paths)
    print(f"Media inventory: {len(paths)} objects, {total / 1024**2:.1f} MiB", flush=True)
    if args.mode == "inventory":
        return
    client, public = connection()
    if args.mode == "probe":
        public_probe(public, paths)
        return
    if args.mode == "verify":
        state = {}
        for index, path in enumerate(paths, 1):
            checksum = digest(path)
            if not verified_head(client, path, checksum):
                raise RuntimeError(f"Missing or mismatched R2 object: {key_for(path)}")
            stat = path.stat()
            state[key_for(path)] = [stat.st_size, stat.st_mtime_ns, checksum]
            if index % 100 == 0:
                print(f"Verified {index}/{len(paths)}", flush=True)
        save_state(state)
        print(f"All {len(paths)} R2 objects verified", flush=True)
        return
    if args.mode == "sync":
        previous = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}
        state = {}
        uploaded = 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            pending = {executor.submit(sync_one, client, path, previous): path for path in paths}
            for future in concurrent.futures.as_completed(pending):
                path = pending[future]
                outcome, checksum = future.result()
                uploaded += outcome == "uploaded"
                stat = path.stat()
                state[key_for(path)] = [stat.st_size, stat.st_mtime_ns, checksum]
        save_state(state)
        print(f"R2 sync complete: {uploaded} changed objects uploaded", flush=True)
        return
    uploaded = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        pending = {executor.submit(upload_one, client, path): path for path in paths}
        for index, future in enumerate(concurrent.futures.as_completed(pending), 1):
            outcome = future.result()
            uploaded += outcome == "uploaded"
            if index % 50 == 0 or index == len(paths):
                print(f"Checked {index}/{len(paths)}; uploaded {uploaded}", flush=True)
    print(f"R2 migration complete: {uploaded} uploaded, {len(paths) - uploaded} already verified", flush=True)
    public_probe(public, paths)


if __name__ == "__main__":
    main()
