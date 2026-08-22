from flask import jsonify, request
from app.agents import Coach


def analyze_report():
    data = request.get_json() or {}
    session_id = data.get("sessionId") or data.get("session_id")
    if not session_id:
        return jsonify({"status": "error", "message": "Missing sessionId"}), 400

    try:
        coach = Coach()
        report = coach.analyze_session(session_id)
        return jsonify({"status": "success", "data": report}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
