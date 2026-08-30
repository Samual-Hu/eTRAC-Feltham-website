from __future__ import annotations

import json
import secrets
import subprocess
import sys
import webbrowser
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
sys.path.insert(0, str(ROOT))

from stain_demo.site_export import export_site_data  # noqa: E402
from stain_demo.web_review import (  # noqa: E402
    VALID_GRADES,
    VALID_TYPES,
    load_overrides,
    save_overrides,
    set_link,
    state_key,
)


TOKEN = secrets.token_urlsafe(24)
CLIENT_MODE = "--client" in sys.argv[1:]
NO_BROWSER = "--no-browser" in sys.argv[1:]
API_VERSION = 2
HISTORY_PATH = ROOT / "annotations" / "web_review_history.jsonl"


def _site_image(value: object) -> Path:
    relative = Path(str(value or ""))
    candidate = (SITE / relative).resolve()
    if SITE.resolve() not in candidate.parents or candidate.suffix.lower() not in {".jpg", ".jpeg", ".png", ".bmp", ".webp"} or not candidate.is_file():
        raise ValueError("A valid website panorama image is required")
    # The website copy is generated output. Launch the annotation App with the
    # original material so a later site refresh can never invalidate its input.
    if len(relative.parts) >= 4 and relative.parts[:2] == ("assets", "media"):
        matches = [path.resolve() for path in (ROOT / "materials").rglob(relative.name) if path.is_file()]
        if len(matches) == 1:
            return matches[0]
        event_id = relative.parts[2]
        event_bits = event_id.split("-")
        compact_date = "".join(event_bits[1:4])[2:] if len(event_bits) >= 4 else ""
        narrowed = [path for path in matches if event_bits[0] in path.parent.name and compact_date in path.parent.name]
        if len(narrowed) == 1:
            return narrowed[0]
    return candidate


def launch_annotation_app(payload: dict) -> dict:
    earlier = _site_image(payload.get("earlierImage"))
    later = _site_image(payload.get("laterImage"))
    pythonw = ROOT / ".venv" / "Scripts" / "pythonw.exe"
    python = pythonw if pythonw.exists() else ROOT / ".venv" / "Scripts" / "python.exe"
    if not python.exists():
        raise ValueError("The local annotation runtime is missing")
    flags = 0 if python == pythonw else getattr(subprocess, "CREATE_NO_WINDOW", 0)
    process = subprocess.Popen(
        [str(python), str(ROOT / "annotation_app.py"), "--earlier", str(earlier), "--later", str(later)],
        cwd=str(ROOT),
        creationflags=flags,
        close_fds=True,
    )
    return {"ok": True, "message": "Annotation app launched", "pid": process.pid}


def _valid_box(value) -> bool:
    return isinstance(value, list) and len(value) == 4 and all(isinstance(number, (int, float)) for number in value) and value[0] < value[2] and value[1] < value[3]


def apply_edit(payload: dict) -> dict:
    action = payload.get("action")
    serial, date = str(payload.get("serial", "")), str(payload.get("date", ""))
    if len(serial) != 6 or len(date) != 10:
        raise ValueError("A six-digit carriage number and ISO date are required")
    document = load_overrides()
    state = document["states"].setdefault(state_key(serial, date), {"serial": serial, "date": date, "annotations": [], "deleted_annotation_ids": []})
    if action == "comparison":
        source_id = str(payload.get("sourceId", ""))
        source_box = payload.get("sourceBBox")
        source_type = payload.get("sourceType")
        target_date = str(payload.get("targetDate", ""))
        target_id = payload.get("targetId") or None
        if not source_id or source_type not in VALID_TYPES or not _valid_box(source_box) or len(target_date) != 10:
            raise ValueError("A valid selected annotation and comparison date are required")
        source_item = {"annotation_id": source_id, "type": source_type, "bbox": [round(number) for number in source_box], "source": "human_web_review"}
        source_items = state.setdefault("annotations", [])
        source_index = next((index for index, item in enumerate(source_items) if item.get("annotation_id") == source_id), None)
        if source_index is None:
            source_items.append(source_item)
        else:
            source_items[source_index] = source_item
        if payload.get("sourceGrade") in VALID_GRADES:
            state["grade"] = payload["sourceGrade"]
        target_state = document["states"].setdefault(state_key(serial, target_date), {"serial": serial, "date": target_date, "annotations": [], "deleted_annotation_ids": []})
        target_box = payload.get("targetBBox")
        if target_id and _valid_box(target_box):
            target_item = {"annotation_id": target_id, "type": payload.get("targetType", "severe"), "bbox": [round(number) for number in target_box], "source": "human_web_review"}
            if target_item["type"] not in VALID_TYPES:
                raise ValueError("Invalid comparison annotation type")
            target_items = target_state.setdefault("annotations", [])
            target_index = next((index for index, item in enumerate(target_items) if item.get("annotation_id") == target_id), None)
            if target_index is None:
                target_items.append(target_item)
            else:
                target_items[target_index] = target_item
        if payload.get("targetGrade") in VALID_GRADES:
            target_state["grade"] = payload["targetGrade"]
        set_link(document, serial, date, source_id, target_date, target_id)
        target_state["updated_at"] = datetime.now(timezone.utc).isoformat()
    elif action == "grade":
        if payload.get("grade") not in VALID_GRADES:
            raise ValueError("Invalid cleanliness grade")
        state["grade"] = payload["grade"]
    elif action == "annotation":
        annotation_id = str(payload.get("annotationId", ""))
        annotation_type = payload.get("type")
        box = payload.get("bbox")
        if not annotation_id or annotation_type not in VALID_TYPES or not _valid_box(box):
            raise ValueError("Annotation id, type and bbox are required")
        item = {"annotation_id": annotation_id, "type": annotation_type, "bbox": [round(number) for number in box], "source": "human_web_review"}
        annotations = state.setdefault("annotations", [])
        index = next((index for index, current in enumerate(annotations) if current.get("annotation_id") == annotation_id), None)
        if index is None:
            annotations.append(item)
        else:
            annotations[index] = item
        state.setdefault("deleted_annotation_ids", [])[:] = [value for value in state.get("deleted_annotation_ids", []) if value != annotation_id]
    elif action == "delete":
        annotation_id = str(payload.get("annotationId", ""))
        state["annotations"] = [item for item in state.get("annotations", []) if item.get("annotation_id") != annotation_id]
        if annotation_id and annotation_id not in state.setdefault("deleted_annotation_ids", []):
            state["deleted_annotation_ids"].append(annotation_id)
    elif action == "link":
        target_date = str(payload.get("targetDate", ""))
        source_id = str(payload.get("sourceId", ""))
        target_id = payload.get("targetId")
        if len(target_date) != 10 or not source_id:
            raise ValueError("Source annotation and target date are required")
        set_link(document, serial, date, source_id, target_date, target_id or None)
    else:
        raise ValueError("Unsupported edit action")
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with HISTORY_PATH.open("a", encoding="utf-8") as history:
        history.write(json.dumps({"saved_at": datetime.now(timezone.utc).isoformat(), "payload": payload}, ensure_ascii=False) + "\n")
    save_overrides(document)
    catalog = export_site_data()
    matching = next((item for item in catalog["comparisons"] if item.get("serial") == serial and item.get("sourceDate") == date and item.get("stainId") == str(payload.get("sourceId", "")) and item.get("targetDate") == str(payload.get("targetDate", ""))), None)
    return {"ok": True, "events": len(catalog["events"]), "comparisons": len(catalog["comparisons"]), "comparisonId": matching.get("id") if matching else None}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)

    def _json(self, status: int, payload: dict) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def do_GET(self):
        if self.path == "/api/dev/status":
            self._json(200, {"enabled": not CLIENT_MODE, "mode": "customer" if CLIENT_MODE else "development", "apiVersion": API_VERSION, "token": TOKEN if not CLIENT_MODE else None})
            return
        super().do_GET()

    def do_POST(self):
        if CLIENT_MODE:
            self._json(403, {"error": "Customer preview is read-only"})
            return
        if self.path not in {"/api/dev/edit", "/api/dev/launch-annotation"}:
            self._json(404, {"error": "Not found"})
            return
        if self.headers.get("X-Dev-Token") != TOKEN:
            self._json(403, {"error": "Local development token required"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            self._json(200, launch_annotation_app(payload) if self.path == "/api/dev/launch-annotation" else apply_edit(payload))
        except (ValueError, json.JSONDecodeError) as exc:
            self._json(400, {"error": str(exc)})
        except Exception as exc:
            self._json(500, {"error": str(exc)})


if __name__ == "__main__":
    print("Refreshing website data from materials...", flush=True)
    try:
        refreshed = export_site_data()
    except Exception as exc:
        raise SystemExit(f"Website refresh failed; the previous catalog was kept intact: {exc}") from exc
    print(f"Website data ready: {len(refreshed['events'])} captures, {len(refreshed['comparisons'])} comparisons", flush=True)
    port_args = [value for value in sys.argv[1:] if value.isdigit()]
    requested_port = int(port_args[0]) if port_args else 8080
    server = None
    for port in range(requested_port, requested_port + 20):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    if server is None:
        raise SystemExit("No free local preview port was found")
    url = f"http://127.0.0.1:{port}/"
    print(f"{'Customer preview (read-only)' if CLIENT_MODE else 'Development editing enabled'} at {url}")
    if not NO_BROWSER:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
