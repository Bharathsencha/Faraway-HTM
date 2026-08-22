#!/usr/bin/env bash
set -euo pipefail

echo "Installing agent dependencies from backend/requirements-agents.txt"
python3 -m pip install --upgrade pip
python3 -m pip install -r backend/requirements-agents.txt

echo "Done. If any package failed, inspect the output and install missing system libs."
