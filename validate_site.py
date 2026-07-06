from pathlib import Path
import re

root = Path(__file__).resolve().parent
index = (root / "index.html").read_text(encoding="utf-8")
js = (root / "assets" / "app.js").read_text(encoding="utf-8")

asset_refs = set(re.findall(r'(?:src|href)="([^"]+)"', index))
asset_refs.update(re.findall(r'"(assets/[^"]+)"', js))

print("asset references")
for ref in sorted(asset_refs):
    if ref.startswith("#"):
        continue
    target = root / ref
    print(f"{ref}: {target.exists()}")

print("carriage images:", js.count("assets/carriages/"))
print("side toggle removed:", "data-side-toggle" not in index and "sideToggle" not in js)
print("navigation arrows removed:", "nav-arrow" not in index and "data-prev-carriage" not in index and "data-next-carriage" not in index)
print("defect count buttons:", "data-highlight-type" in js)
print("position columns removed:", "Dirt positions" not in index and "Scratch positions" not in index)
print("graffiti column:", "Graffiti" in index and "graffiti: 0" in js)
print("visual order reversed:", "const visualCarriages = [...carriages].reverse();" in js)
print("magnifier added:", "magnifier" in js and ".magnifier" in (root / "assets" / "styles.css").read_text(encoding="utf-8"))
