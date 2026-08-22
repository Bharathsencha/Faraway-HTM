import os
from typing import Dict
from app.agents.genai_wrapper import genai_client, genai_available
import re

from app.services.db_service import get_db

# wrapper provides `genai_available` and `genai_client`


class Actor:
    """Actor agent that simulates company-specific negotiation behavior.

    Starts as a simple rule-based fallback. If a GenAI key is present, it can
    optionally call the model to produce responses.
    """

    def __init__(self, company_name: str):
        self.company = company_name
        try:
            self.db = get_db()
        except Exception:
            self.db = None

    def respond_with_genai(self, current_offer: float, requested: float, step: int = 0) -> Dict:
        if not genai_available:
            return self.respond(current_offer, requested, step)

        prompt = f"""
You are role-playing as a company's HR during a salary negotiation. Company: {self.company}.
Current HR offer: {current_offer}. Candidate requested: {requested}.
Respond with a JSON object containing keys: counter_offer (number), message (short), tactic (one-line).
Keep values realistic for the company context.
"""
        try:
            text = genai_client.generate_text(prompt)
            # Try to extract numbers from the response
            m = re.search(r"([0-9,]+)", text.replace('₹',''))
            if m:
                co = float(m.group(1).replace(',', ''))
            else:
                # fallback to deterministic
                d = requested - current_offer
                co = current_offer + d * 0.05
            return {"counter_offer": round(co, 2), "message": text.strip(), "tactic": "genai"}
        except Exception:
            return self.respond(current_offer, requested, step)

    def build_profile_from_research(self) -> Dict:
        # Aggregate research rows for this company to derive behavior
        rows = []
        for doc in self.db["salary_research"].find({"data.company": {"$regex": self.company, "$options": "i"}}):
            for r in doc.get("data", []):
                if r.get("company") and self.company.lower() in r.get("company", "").lower():
                    rows.append(r)

        profile = {"company": self.company, "base_flexibility_pct": 0.05, "bonus_flexibility_pct": 0.1, "pressure_tactics": []}
        if not rows:
            return profile

        # If company shows high averages relative to min, be slightly more flexible
        avgs = [float(r.get("avg")) for r in rows if r.get("avg")]
        mins = [float(r.get("min")) for r in rows if r.get("min")]
        maxs = [float(r.get("max")) for r in rows if r.get("max")]
        if avgs:
            avg = sum(avgs) / len(avgs)
            profile["base_flexibility_pct"] = 0.06 if avg > 500000 else 0.04
        if maxs and mins:
            # larger ranges = more negotiation room
            avg_range = sum([m for m in maxs]) / len(maxs) - sum([m for m in mins]) / len(mins)
            if avg_range > 500000:
                profile["base_flexibility_pct"] += 0.03

        # Detect funding / hiring hints in source docs
        # simplistic: if company in doc contains 'Series' in any field, increase flexibility
        for doc in self.db["salary_research"].find({"data": {"$exists": True}}):
            for r in doc.get("data", []):
                txt = " ".join([str(v) for v in r.values() if v])
                if "Series" in txt or "raised" in txt or "funding" in txt:
                    profile["bonus_flexibility_pct"] += 0.02
                    profile["pressure_tactics"].append("may_use_deadline")

        return profile

    def get_behavior_profile(self) -> Dict:
        # Try to load stored behavior profile for the company
        p = self.db["company_behaviors"].find_one({"company": {"$regex": self.company, "$options": "i"}})
        if p:
            return p
        # default behavior
        return {"company": self.company, "base_flexibility_pct": 0.05, "bonus_flexibility_pct": 0.1}

    def respond(self, current_offer: float, requested: float, step: int = 0) -> Dict:
        profile = self.get_behavior_profile()
        # enrich by merging research-derived profile
        try:
            research_profile = self.build_profile_from_research()
            # merge heuristics
            profile["base_flexibility_pct"] = max(profile.get("base_flexibility_pct", 0.05), research_profile.get("base_flexibility_pct", 0.05))
            profile["bonus_flexibility_pct"] = max(profile.get("bonus_flexibility_pct", 0.1), research_profile.get("bonus_flexibility_pct", 0.1))
            profile.setdefault("pressure_tactics", [])
            profile["pressure_tactics"] = list(set(profile["pressure_tactics"]) | set(research_profile.get("pressure_tactics", [])))
        except Exception:
            pass
        # simple deterministic response: move by a fraction of requested delta
        delta = requested - current_offer
        move = delta * profile.get("base_flexibility_pct", 0.05)
        counter = current_offer + move
        return {"counter_offer": round(counter, 2), "reason": "company-profile-simulated"}
