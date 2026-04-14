# Publishing `study-sync-utils` to PyPI

This guide covers the exact steps needed to publish your utility library to the official Python Package Index (PyPI). This will allow anyone (including your EC2 instance) to install your library via `pip install study-sync-utils`.

## 1. Prerequisites
- Create an account on [PyPI](https://pypi.org/).
- Create an API token by going to **Account Settings > API tokens** on the PyPI dashboard. Save this token somewhere secure.

## 2. Update `setup.py`
Before publishing, ensure your package name in `setup.py` is completely unique across all of PyPI. For example, `study-sync-utils` might already be taken. If it is, change it to something like `study-sync-utils-fissi` or `study-sync-utils-2026`.

## 3. Install Build Tools
On your local machine (or your EC2 instance, wherever you are publishing from):
```bash
pip install build twine
```
- `build`: Responsible for taking your code and building a distribution wheel (`.whl`).
- `twine`: The official PyPI utility used to securely upload the wheel.

## 4. Build the Package
Navigate into the library directory and run the build command:
```bash
cd study-group-app/study_sync_utils_py
python -m build
```
This will create a `dist/` directory containing a `.tar.gz` and a `.whl` file.

## 5. Upload to PyPI
Use Twine to upload the created distribution files:
```bash
twine upload dist/*
```
When prompted:
- **Username**: Type `__token__` (exactly as written).
- **Password**: Paste the PyPI API token you generated (including the `pypi-` prefix).

## 6. Verify and Install 
Once uploaded, you will be able to see your public package on `https://pypi.org/project/[your-package-name]`.

You can now change `backend_py/requirements.txt` to safely point to this published package:
```text
# instead of installing locally, simply add:
study-sync-utils-fissi==0.1.0
```
