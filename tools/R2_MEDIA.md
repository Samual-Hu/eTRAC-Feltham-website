# R2 media for GitHub Pages

The published catalog points image, panorama tile, comparison tile, and video URLs to the public `etrac-media` R2 bucket. The site source remains on GitHub Pages. Local media under `site/assets/media`, `site/assets/compare`, `site/assets/carriages`, and `site/assets/carriages-q4809` is deliberately retained for annotation and export, but ignored by Git.

Keep `Cloudflare_API.txt` in the project root, outside the `site` Git repository. It is ignored locally; never commit or paste its credentials. `site/media-config.json` contains only the public `r2.dev` base URL.

After adding or regenerating media, run from the project root:

```powershell
.\.venv\Scripts\python.exe site\tools\r2_media.py sync
.\.venv\Scripts\python.exe site\tools\r2_media.py probe
```

The local export and annotation paths also trigger `sync` automatically. `verify` performs a slower, full SHA-256 comparison against every R2 object. `sync` uses an ignored local state file to avoid uploading unchanged objects. Before publishing a newly generated catalog, ensure that every referenced object is uploaded and the public probe passes.

The `r2.dev` address is publicly readable and intended by Cloudflare for development traffic. It does not inherit the HTML password gate. For a production presentation with sustained traffic, use an R2 custom domain and update `media-config.json`, then regenerate the catalog. A normal Git deletion removes media from the current branch and the Pages build, but older Git commits still contain historical copies; erasing those would require a separate coordinated history rewrite and force-push.
