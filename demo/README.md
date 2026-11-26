# CHINGU public product preview

A standalone responsive investor-facing technical showcase with a dependency-free animated 3D projection and six specialist workflow experiences. Editable inputs feed deterministic browser-local tools; there is no hosted model inference, API request, server storage or external execution. Results, notes, approval and history remain in memory until the tab reloads. Copy and download are local. No backend is deployed in the public site.

Run locally: `python -m http.server 8080 --directory demo`.

Tests: `node --test demo/engine.test.cjs`; `node --check demo/app.js`.
