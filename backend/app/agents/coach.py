from typing import Dict, List
import os
from app.services.db_service import get_db
from app.agents.genai_wrapper import genai_client, genai_available


def log_player_action(session_id: str, action: Dict):
    db = get_db()
    db["coach_actions"].insert_one({"session_id": session_id, "action": action})


class Coach:
    """Coach agent that analyzes a finished session and produces feedback.

    For now it aggregates actions and (optionally) calls GenAI to produce a textual
    breakdown. This is a starting point for more sophisticated coaching.
    """

    def __init__(self):
        self.db = get_db()

    def analyze_session(self, session_id: str) -> Dict:
        actions = list(self.db["coach_actions"].find({"session_id": session_id}))
        summary = {
            "session_id": session_id,
            "actions_count": len(actions),
            "advice": "No smart advice available (GenAI key not configured).",
        }
        # Basic heuristic analysis when GenAI isn't available
        if not genai_available:
            accepts = 0
            counters = 0
            total_counter_delta = 0.0
            caves = 0
            for a in actions:
                act = a.get("action") or a.get("action", {})
                # action payloads vary; check common markers
                payload = a.get("action") if isinstance(a.get("action"), dict) else a.get("payload") or a.get("action") or a.get("action_type") or a
                if isinstance(payload, dict):
                    if payload.get("type") == "accept" or payload.get("accepted"):
                        accepts += 1
                    if payload.get("type") == "cave" or payload.get("caved"):
                        caves += 1
                    if payload.get("counter_offer"):
                        counters += 1
                        try:
                            orig = float(payload.get("current_offer") or payload.get("orig_offer") or 0)
                            co = float(payload.get("counter_offer"))
                            total_counter_delta += max(0.0, co - orig)
                        except Exception:
                            pass
                else:
                    text = str(payload).lower()
                    if "accept" in text:
                        accepts += 1
                    if "cave" in text or "give up" in text or "accept" in text and "quick" in text:
                        caves += 1

            advice_lines = []
            if accepts > 0 and counters == 0:
                advice_lines.append("You accepted offers without countering — try making at least one counter.")
            if caves > max(1, accepts // 2):
                advice_lines.append("You tended to cave early; hold your ground and state your ask with evidence.")
            if counters > 0:
                avg_move = total_counter_delta / counters if counters else 0
                if avg_move < 0.02 * (total_counter_delta or 1):
                    advice_lines.append("Your counter moves were very small; consider asking more aggressively.")

            if not advice_lines:
                advice_lines.append("Good job — no obvious mistakes detected. Work on clear asks and evidence.")

            summary["advice"] = " ".join(advice_lines)
        if genai_available and len(actions) > 0:
            try:
                prompt = f"You are a salary negotiation coach. Given these raw player actions: {actions}, write a short feedback of what to improve. Provide 3 bullet points."
                text = genai_client.generate_text(prompt)
                summary["advice"] = text
            except Exception:
                pass

        return summary
