from typing import Tuple, Dict, Optional
from app.services.db_service import get_db


def calculate_salary(company: str, role: str, city: str, current_offer: Optional[float] = None) -> Dict:
    """Simple calculator that returns (low, ask, high) in the same units as stored.

    It queries `salary_research` collection for matching entries and computes
    min/avg/max. Falls back to conservative multipliers if no data.
    """
    db = get_db()
    query = {"data.company": {"$regex": company, "$options": "i"}}
    docs = list(db["salary_research"].find(query))

    values = []
    for d in docs:
        for row in d.get("data", []):
            try:
                if (row.get("company") and row.get("role") and row.get("city") and
                        company.lower() in row.get("company", "").lower() and
                        role.lower() in row.get("role", "").lower() and
                        city.lower() in row.get("city", "").lower()):
                    # assume numeric salary in `salary` or `avg`
                    if row.get("salary"):
                        values.append(float(row.get("salary")))
                    elif row.get("avg"):
                        values.append(float(row.get("avg")))
            except Exception:
                continue

    if values:
        low = min(values)
        avg = sum(values) / len(values)
        high = max(values)
    else:
        # fallback: use current_offer if given, otherwise conservative defaults
        if current_offer:
            low = current_offer * 0.85
            avg = current_offer * 1.0
            high = current_offer * 1.2
        else:
            low = 300000
            avg = 600000
            high = 1000000

    # Decide three numbers: lowest acceptable, ask, aspirational
    lowest_acceptable = low
    ask_number = avg
    best_case = high

    return {
        "lowest_acceptable": lowest_acceptable,
        "ask": ask_number,
        "best_case": best_case,
        "source_rows": len(values),
    }
