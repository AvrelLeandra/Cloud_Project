#!/usr/bin/env bash
# Exit immediately on error
set -o errexit

echo "=== Installing Python dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Building React Frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Build Completed Successfully ==="
