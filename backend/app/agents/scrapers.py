"""Site-specific scrapers with graceful fallbacks.

Provides functions to fetch salary hints from Levels.fyi and Glassdoor.
Uses `requests` + `bs4` when available; falls back to urllib and regex.
"""
from typing import Dict
import re
import os

try:
    import requests
except Exception:
    requests = None

try:
    from bs4 import BeautifulSoup
except Exception:
    BeautifulSoup = None


def _get_html(url: str, timeout: int = 8) -> str:
    if requests is not None:
        r = requests.get(url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
        if getattr(r, 'status_code', 200) != 200:
            raise RuntimeError(f"status_{r.status_code}")
        return r.text
    from urllib.request import urlopen, Request
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=timeout) as fh:
        return fh.read().decode('utf-8', errors='ignore')


def _extract_money_values(text: str) -> Dict:
    # find numbers and simple units
    money_re = re.compile(r"\b(?:₹|INR)?\s?([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?:\s?(LPA|lakhs|lakh|crore|cr|k)?)\b", re.IGNORECASE)
    vals = []
    for m in money_re.findall(text):
        raw = " ".join(m)
        num = re.sub(r"[^0-9]", "", m[0])
        try:
            v = int(num)
        except Exception:
            v = 0
        vals.append({"raw": raw, "value": v})
    if not vals:
        return {"count": 0}
    nums = [v["value"] for v in vals if v.get("value")]
    return {"count": len(nums), "min": min(nums), "max": max(nums), "avg": sum(nums)//len(nums) if nums else 0, "samples": vals[:10]}


def fetch_levels_fyi(company: str, role: str = "") -> Dict:
    """Attempt to fetch a Levels.fyi page for the company and extract salary numbers."""
    query = company.replace(' ', '-').lower()
    url = f"https://www.levels.fyi/company/{query}/salaries/"
    try:
        html = _get_html(url)
        if BeautifulSoup is not None:
            soup = BeautifulSoup(html, 'html.parser')
            text = soup.get_text(separator=' ')
        else:
            text = html
        res = _extract_money_values(text)
        res.update({"source": "levels.fyi", "url": url})
        return res
    except Exception as e:
        return {"error": str(e), "source": "levels.fyi", "url": url}


def fetch_glassdoor(company: str, role: str = "") -> Dict:
    """Attempt to fetch a Glassdoor search result and extract salary clues."""
    # Glassdoor often blocks automated requests; use search endpoint as best-effort
    q = company.replace(' ', '+')
    url = f"https://www.glassdoor.co.in/Reviews/{q}-reviews-SRCH_KE0,0.htm"
    try:
        html = _get_html(url)
        if BeautifulSoup is not None:
            soup = BeautifulSoup(html, 'html.parser')
            text = soup.get_text(separator=' ')
        else:
            text = html
        res = _extract_money_values(text)
        res.update({"source": "glassdoor", "url": url})
        return res
    except Exception as e:
        return {"error": str(e), "source": "glassdoor", "url": url}


def fetch_by_company(company: str, role: str = "") -> Dict:
    """High-level helper: try levels.fyi then glassdoor."""
    out = fetch_levels_fyi(company, role)
    if out.get('count', 0) > 0:
        return out
    g = fetch_glassdoor(company, role)
    if g.get('count', 0) > 0:
        return g
    return {"source": "none", "error": "no_data_found"}
