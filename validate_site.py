from __future__ import annotations

import json
import re
from pathlib import Path


root = Path(__file__).resolve().parent
public_base = json.loads((root / "media-config.json").read_text(encoding="utf-8"))["publicBaseUrl"].rstrip("/")


def local_media_path(value: str, site_root: Path) -> Path:
    if value.startswith(public_base + "/"):
        value = value[len(public_base) + 1:]
    if not value.startswith(("assets/media/", "assets/compare/", "assets/carriages/", "assets/carriages-q4809/")) or ".." in Path(value).parts:
        raise ValueError(f"Unexpected media URL: {value}")
    return site_root / value


errors = []
catalog = {"events": [], "comparisons": []}
for name in ("index.html", "event.html", "compare.html"):
    path = root / name
    if not path.exists():
        errors.append(f"missing page: {name}")
        continue
    local_source = root.parent / "site-source" / name
    text = (local_source if local_source.is_file() else path).read_text(encoding="utf-8")
    for reference in re.findall(r'(?:src|href)="([^"?#]+)', text):
        if reference.startswith(("http:", "https:", "javascript:")):
            continue
        if not (root / reference).exists():
            errors.append(f"{name}: missing {reference}")
catalog_path = root / "assets" / "catalog.json"
if not catalog_path.exists():
    errors.append("missing assets/catalog.json")
else:
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    ids = [event["id"] for event in catalog.get("events", [])]
    if len(ids) != len(set(ids)):
        errors.append("duplicate event IDs: separate repeated visits by capture time")
    for event in catalog.get("events", []):
        for field in ("cover", "video"):
            value = event.get(field)
            if value and (not local_media_path(value, root).is_file() or local_media_path(value, root).stat().st_size == 0):
                errors.append(f"{event['id']}: missing {value}")
        for carriage in event.get("carriages", []):
            if not local_media_path(carriage["image"], root).is_file() or local_media_path(carriage["image"], root).stat().st_size == 0:
                errors.append(f"{event['id']}: missing {carriage['image']}")
    for comparison in catalog.get("comparisons", []):
        for field in ("sourceTile", "targetTile"):
            if not local_media_path(comparison[field], root).is_file() or local_media_path(comparison[field], root).stat().st_size == 0:
                errors.append(f"{comparison['id']}: missing {comparison[field]}")
if errors:
    raise SystemExit("\n".join(errors))
print(f"Site valid: {len(catalog['events'])} events, {len(catalog['comparisons'])} comparisons")
