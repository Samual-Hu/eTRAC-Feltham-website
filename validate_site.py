from __future__ import annotations

import json
import re
from pathlib import Path


root = Path(__file__).resolve().parent
errors = []
catalog = {"events": [], "comparisons": []}
for name in ("index.html", "event.html", "compare.html"):
    path = root / name
    if not path.exists():
        errors.append(f"missing page: {name}")
        continue
    text = path.read_text(encoding="utf-8")
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
    for event in catalog.get("events", []):
        for field in ("cover", "video"):
            value = event.get(field)
            if value and (not (root / value).is_file() or (root / value).stat().st_size == 0):
                errors.append(f"{event['id']}: missing {value}")
        for carriage in event.get("carriages", []):
            if not (root / carriage["image"]).is_file() or (root / carriage["image"]).stat().st_size == 0:
                errors.append(f"{event['id']}: missing {carriage['image']}")
    for comparison in catalog.get("comparisons", []):
        for field in ("sourceTile", "targetTile"):
            if not (root / comparison[field]).is_file() or (root / comparison[field]).stat().st_size == 0:
                errors.append(f"{comparison['id']}: missing {comparison[field]}")
if errors:
    raise SystemExit("\n".join(errors))
print(f"Site valid: {len(catalog['events'])} events, {len(catalog['comparisons'])} comparisons")
