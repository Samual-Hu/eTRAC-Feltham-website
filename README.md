# Eyya Train Surface Viewer — local preview

## Password-protected public HTML

GitHub Pages entrypoints now use StatiCrypt. Local HTML authoring copies live
outside this repository in `../site-source/`; the local server serves those
copies without a password. Do not edit the generated root HTML directly.
See `tools/ACCESS.md` for rebuilding and the limits of this lightweight protection.

This static site has two customer-facing layers:

1. `index.html`: a compact date/unit library. Panorama captures open the review page; video-only covers play immediately without a redundant detail page.
2. `event.html`: panorama review, A/B switching when both sides exist, one video icon, severe-region date branches and same-area comparison.

The exporter accepts material folders such as `701042_260714_1918_A_Pano` and video-only folders without a side suffix. Date branches automatically expand toward the side with more screen space. The comparison page uses a transparent boundary marker rather than a crosshair over the stain.

`Start Local Website.bat` starts the local review server. Only this localhost mode exposes `LOCAL EDIT` controls for cleanliness, annotation class, deletion, bbox redrawing and explicit cross-date pairing. Reviews are saved to `annotations/web_review_overrides.json` and are consumed by both the exporter and the desktop annotation App. Static hosting such as GitHub Pages has no write API, so the same pages remain read-only after publication.

## Local testing

Double-click `Start Local Website.bat` for editing (`http://127.0.0.1:8270/`), or `Start Customer Preview.bat` for a read-only preview (`http://127.0.0.1:8280/`). A nearby free port is used if necessary. The browser opens immediately with the current catalog while material updates are exported in the background. Images and videos are served from local copies; startup and local annotation do not wait for R2 or require internet access. The page reloads after new captures are ready. Close the command window to stop the server.

## Refreshing data from the annotation App

After saving Ground Truth, click `导出网站` in the desktop annotation App. This runs the same process as:

```text
..\.venv\Scripts\python.exe -m stain_demo.site_export
```

The exporter reads `materials`, uses human-reviewed `temporal_ground_truth.json` states where available, copies local media, creates comparison tiles and refreshes `assets/catalog.json` / `assets/catalog.js`.

No GitHub push or deployment is performed.

Before publishing updated media or annotations, run `tools/r2_media.py sync` explicitly. Cloud uploads are separate from the local review workflow.

The fleet overview's Severe, Minor and Graffiti metrics open a list of all matching carriage panoramas, retaining the selected date and wash filters. Each dated observation is listed separately. Open a panorama from this list to inspect its annotations or launch the local annotation App.
