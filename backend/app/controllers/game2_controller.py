from flask import jsonify
from app.services import game2_service
from app.agents import calculate_salary, log_player_action


def init_session(data):
    company = data.get('companyName')
    role = data.get('role')
    offer = data.get('currentOffer')
    city = data.get('city') or data.get('location') or ""

    if not all([company, role, offer]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # initialize base game data
        result = game2_service.initialize_game(company, role, float(offer))

        # enrich with calculator results
        try:
            calc = calculate_salary(company, role, city, float(offer))
            result["salary_recommendation"] = calc
        except Exception:
            result["salary_recommendation"] = {"error": "calculation_failed"}

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def process_move(data):
    # record player action for coaching/analysis
    try:
        session_id = data.get("sessionId") or data.get("session_id")
        if session_id:
            try:
                log_player_action(session_id, data)
            except Exception:
                pass

        result = game2_service.calculate_move(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def predict_salary(data):
    """
    Uses Tavily + Groq to predict realistic market salary
    for a given company + role combination.
    """
    company = data.get('company', '').strip()
    role = data.get('role', '').strip()
    current_offer = float(data.get('currentOffer', 0) or 0)

    if not company or not role:
        return jsonify({"error": "company and role are required"}), 400

    try:
        result = game2_service._fetch_tavily_salary_data(company, role)

        if result:
            return jsonify({
                "predicted_salary": result["avg"],
                "min_salary": result["min"],
                "max_salary": result["max"],
                "confidence": result.get("confidence", "low"),
                "sources": result.get("sources", []),
                "reasoning": result.get("reasoning", ""),
                "source": "tavily",
            }), 200
        else:
            # Fallback: conservative estimate based on the offer itself
            fallback = int(current_offer * 1.05) if current_offer > 0 else 400000
            return jsonify({
                "predicted_salary": fallback,
                "min_salary": int(fallback * 0.85),
                "max_salary": int(fallback * 1.20),
                "confidence": "low",
                "sources": [],
                "reasoning": "Tavily search returned no results; using conservative estimate.",
                "source": "fallback",
            }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500