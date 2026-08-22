import datetime
from pathlib import Path
import csv
import os
from typing import List, Dict
from app.services.db_service import get_db
try:
    import requests
except Exception:
    requests = None

try:
    from bs4 import BeautifulSoup
except Exception:
    BeautifulSoup = None
import re


class Researcher:
    """Researcher agent skeleton.

    - `run_once` should be called by a scheduler (cron / APScheduler).
    - Currently a placeholder that creates an empty research record.
    """

    def __init__(self):
        try:
            self.db = get_db()
        except Exception:
            self.db = None
        # repo root is 3 levels up from this file: backend/app/agents -> project root
        self.repo_root = Path(__file__).resolve().parents[3]

    def run_once(self) -> Dict:
        # Try to ingest a local CSV (india_salary_data.csv) if present.
        data = []
        csv_path = self.repo_root / "india_salary_data.csv"
        if csv_path.exists():
            try:
                with open(csv_path, newline='', encoding='utf-8') as fh:
                    reader = csv.DictReader(fh)
                    for row in reader:
                        # normalize keys
                        entry = {
                            "company": row.get("Company") or row.get("company"),
                            "role": row.get("Role") or row.get("role"),
                            "city": row.get("City") or row.get("city") or row.get("City"),
                            "min": row.get("Min_LPA") or row.get("Min") or None,
                            "max": row.get("Max_LPA") or row.get("Max") or None,
                            "avg": row.get("Average_LPA") or row.get("Average") or None,
                            "source": "local_csv",
                        }
                        data.append(entry)
            except Exception:
                data = []

        record = {
            "created_at": datetime.datetime.utcnow(),
            "source": "local_csv" if data else "placeholder",
            "data": data,
        }
        if self.db is not None:
            res = self.db["salary_research"].insert_one(record)
            return {"inserted_id": str(res.inserted_id), "rows": len(data)}
        else:
            # fallback: write to a local JSON file
            out_dir = self.repo_root
            out_path = out_dir / "backend" / "data"
            out_path.mkdir(parents=True, exist_ok=True)
            file_path = out_path / f"salary_research_fallback_{datetime.datetime.utcnow().isoformat()}.json"
            try:
                import json
                with open(file_path, "w", encoding="utf-8") as fh:
                    json.dump(record, fh, default=str, ensure_ascii=False, indent=2)
                return {"written_file": str(file_path), "rows": len(data)}
            except Exception as e:
                return {"error": str(e)}

    def fetch_from_url(self, url: str) -> Dict:
        """Lightweight scraper: fetch page, extract monetary amounts and heuristics."""
        try:
            if requests is not None:
                resp = requests.get(url, timeout=8)
                status = getattr(resp, 'status_code', 200)
                if status != 200:
                    return {"url": url, "error": f"status_{status}"}
                html_text = resp.text
            else:
                # fallback to urllib
                from urllib.request import urlopen
                with urlopen(url, timeout=8) as fh:
                    html_text = fh.read().decode('utf-8', errors='ignore')

            if BeautifulSoup is not None:
                soup = BeautifulSoup(html_text, "html.parser")
                text = soup.get_text(separator=" ")
            else:
                text = html_text
            # crude money regex (numbers with commas and optional lakh/crore/₹)
            money_re = re.compile(r"\b(?:₹|INR)?\s?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?:\s?(LPA|lakhs|lakh|crore|cr|k)?)\b", re.IGNORECASE)
            matches = money_re.findall(text)
            parsed = []
            for m in matches:
                parsed.append({"raw": " ".join(m)})
            return {"url": url, "counts": len(matches), "matches": parsed}
        except Exception as e:
            return {"url": url, "error": str(e)}

    def run_with_seeds(self, seeds: list) -> Dict:
        from app.agents.scrapers import fetch_by_company
        results = []
        for seed in seeds:
            # If seed looks like a URL, fetch directly; otherwise treat as company name
            if seed.startswith('http://') or seed.startswith('https://'):
                results.append(self.fetch_from_url(seed))
            else:
                # Allow 'company|role' syntax
                parts = [p.strip() for p in seed.split('|') if p.strip()]
                company = parts[0]
                role = parts[1] if len(parts) > 1 else ''
                try:
                    results.append(fetch_by_company(company, role))
                except Exception:
                    results.append({"error": "scrape_failed", "seed": seed})
        record = {"created_at": datetime.datetime.utcnow(), "source": "seeds", "data": results}
        if self.db is not None:
            res = self.db["salary_research"].insert_one(record)
            return {"inserted_id": str(res.inserted_id), "seed_count": len(results)}
        else:
            out_dir = self.repo_root
            out_path = out_dir / "backend" / "data"
            out_path.mkdir(parents=True, exist_ok=True)
            file_path = out_path / f"salary_research_seeds_{datetime.datetime.utcnow().isoformat()}.json"
            try:
                import json
                with open(file_path, "w", encoding="utf-8") as fh:
                    json.dump(record, fh, default=str, ensure_ascii=False, indent=2)
                return {"written_file": str(file_path), "seed_count": len(results)}
            except Exception as e:
                return {"error": str(e)}


def run_researcher():
    r = Researcher()
    res = r.run_once()
    # If RESEARCH_SEEDS env var is set, run seed ingestion as well
    seeds_env = os.getenv("RESEARCH_SEEDS")
    if seeds_env:
        seeds = [s.strip() for s in seeds_env.split(",") if s.strip()]
        if seeds:
            try:
                seed_res = r.run_with_seeds(seeds)
                res["seeds"] = seed_res
            except Exception:
                res["seeds"] = {"error": "seed_ingest_failed"}
    return res
