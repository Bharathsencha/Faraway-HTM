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