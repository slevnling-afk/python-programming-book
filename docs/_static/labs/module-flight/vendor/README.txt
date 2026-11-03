Module-flight uses a real, pinned CPython WebAssembly runtime (Pyodide 0.29.0).
All interpreter files and package wheels are served locally by this repository;
no CDN or PyPI requests occur while students run the lessons.

Pyodide core: official npm package pyodide@0.29.0 (MPL-2.0).
Source integrity and per-file SHA256 values: MANIFEST.json.
Two large official assets are stored as small binary parts for publication.
ASSET_PARTS.json preserves their original sizes and SHA256 values. The worker
reassembles and checks every part and the complete original asset before use.
No changes are made to the official runtime bytes. Original-source URLs and
hashes remain recorded under reassembled_assets in MANIFEST.json.
Pyodide license: pyodide/LICENSE.txt. CPython standard library files in
python_stdlib.zip retain their original Python Software Foundation notices.

micropip 0.11.0 and packaging 24.2 wheels match official Pyodide lockfile hashes.
geopy 2.4.1 (MIT) and geographiclib 2.0 (MIT) are unmodified official PyPI wheels;
their original licenses and dist-info metadata are included in each wheel.

The visible python -m pip command is parsed as a classroom installation request.
Actual installation into this page's isolated Python filesystem is performed by
micropip.install(local wheel URLs, deps=False). It does not run an OS shell or
install anything on the student's computer. Exported projects use normal pip.
