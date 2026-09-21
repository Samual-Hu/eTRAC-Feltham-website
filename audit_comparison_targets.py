"""Check every displayed comparison target against current boxes and links."""
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from stain_demo.web_review import load_overrides, linked_target_id, legacy_review_side

catalog = json.loads((Path(__file__).parent / 'assets/catalog.json').read_text(encoding='utf-8'))
overrides = load_overrides()
for link in overrides.get('links', []):
    if not link.get('side'):
        link['side'] = legacy_review_side(link.get('serial'), link.get('source_date'))
bad = []
shown = 0
for pair in catalog['comparisons']:
    if not pair['targetReviewed']:
        continue
    shown += 1
    source = next(e for e in catalog['events'] if e['id'] == pair['sourceEventId'])
    event = next((e for e in catalog['events'] if e['unit'] == pair['unit'] and e['date'] == pair['targetDate'] and e['side'] == source['side']), None)
    carriage = next((c for c in (event or {}).get('carriages', []) if c['serial'] == pair['serial']), {})
    linked, target_id = linked_target_id(overrides, pair['serial'], pair['sourceDate'], pair['stainId'], pair['targetDate'], source['side'])
    target = next((d for d in carriage.get('defects', []) if d['id'] == target_id), None)
    if not linked or not target or pair['targetAnnotationId'] != target_id or pair['targetBox'] != target['box']:
        bad.append(pair['id'])
print(json.dumps({'comparisons':len(catalog['comparisons']), 'displayed_targets':shown, 'invalid_targets':len(bad), 'invalid_ids':bad}, indent=2))
sys.exit(bool(bad))
