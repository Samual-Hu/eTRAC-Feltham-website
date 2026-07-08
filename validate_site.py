from pathlib import Path
import re

root = Path(__file__).resolve().parent
index = (root / "index.html").read_text(encoding="utf-8")
js = (root / "assets" / "app.js").read_text(encoding="utf-8")
css = (root / "assets" / "styles.css").read_text(encoding="utf-8")

asset_refs = set(re.findall(r'(?:src|href)="([^"]+)"', index))
asset_refs.update(re.findall(r'"(assets/[^"]+)"', js))

print("asset references")
for ref in sorted(asset_refs):
    if ref.startswith("#"):
        continue
    target = root / ref
    print(f"{ref}: {target.exists()}")

print("q1656 carriage images:", js.count("assets/carriages/"))
print("q4809 carriage images:", js.count("assets/carriages-q4809/"))
print("side toggle removed:", "data-side-toggle" not in index and "sideToggle" not in js)
print("navigation arrows removed:", "nav-arrow" not in index and "data-prev-carriage" not in index and "data-next-carriage" not in index)
print("defect count buttons:", "data-highlight-type" in js)
print("cleanliness column:", "Cleanliness" in index and "cleanliness" in js)
print("severe column:", "Severe" in index and "count-severe" in css)
print("position columns removed:", "Dirt positions" not in index and "Scratch positions" not in index)
print("dirt header removed:", "<th scope=\"col\">Dirt</th>" not in index)
print("graffiti column:", "Graffiti" in index and "graffiti: 0" in js)
print("q1656 visual order reversed:", 'visualOrder: "reverse"' in js)
print("q4809 visual order normal:", 'visualOrder: "normal"' in js)
print("public side labels:", "View Side B" in index and "Side A exterior surface defects" in index)
print("public camera labels hidden:", "Q1656" not in index and "Q4809" not in index)
print("magnifier added:", "magnifier" in js and ".magnifier" in css)
