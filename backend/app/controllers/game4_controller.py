from flask import jsonify, request
from app.services import game4_service
from app.models.dashboard_model import find_profile_by_user_id
from app.agents import log_player_action

def start_session(user_id):
    try:
        profile = find_profile_by_user_id(user_id) or {}
        level = profile.get("level", 1)
        session_data = game4_service.initialize_game(level)
        return jsonify({"status": "success", "data": session_data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def get_question_for_round(user_id, round_num):
    try:
        profile = find_profile_by_user_id(user_id) or {}
        level = profile.get("level", 1)
        seen_ids = request.args.get('seen', '').split(',')
        seen_ids = [s.strip() for s in seen_ids if s.strip()]
        
        question = game4_service.fetch_question_for_level(level, round_num, seen_ids)
        if not question:
            return jsonify({"status": "error", "message": "Game Over"}), 404
        return jsonify({"status": "success", "data": question}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def evaluate_player_answer(user_id, data):
    question_id = data.get('questionId')
    selected_option = data.get('selectedOptionId')
    confidence_bet = data.get('confidenceBet')
    current_rating = data.get('currentRating', 50)
    open_answer = data.get('openAnswer', '')

    if not question_id or confidence_bet is None:
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    try:
        # Pass to the AI Service
        result = game4_service.evaluate_with_agent(
            question_id, selected_option, open_answer, confidence_bet, current_rating
        )
        # log action for coach
        try:
            session_id = data.get("sessionId") or data.get("session_id")
            if session_id:
                log_player_action(session_id, {"type": "game4_evaluate", "payload": data})
        except Exception:
            pass
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def process_lifeline(user_id, data):
    lifeline_type = data.get('type')  # '50_50' or 'hint'
    question_id = data.get('questionId')

    try:
        result = game4_service.generate_lifeline(question_id, lifeline_type)
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500