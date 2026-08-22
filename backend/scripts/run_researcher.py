"""Run the Researcher agent once.

Usage:
  python3 backend/scripts/run_researcher.py

For scheduling, add a cron entry like:
  0 6 * * * cd /path/to/project && ./.venv/bin/python3 backend/scripts/run_researcher.py >> /var/log/researcher.log 2>&1
"""
import sys
from pathlib import Path

# Ensure repository root is on sys.path so `app` package imports work
repo_root = Path(__file__).resolve().parents[2]
backend_path = repo_root / "backend"
sys.path.insert(0, str(backend_path))

from app.agents import run_researcher
import json


def main():
    res = run_researcher()
    print(json.dumps(res, default=str))


if __name__ == "__main__":
    main()
