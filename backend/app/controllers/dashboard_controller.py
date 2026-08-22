from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.dashboard_service import get_dashboard_overview, get_dashboard_profile, save_dashboard_profile, record_activity, update_dashboard_profile


@jwt_required()
def overview():
    user_id = get_jwt_identity()
    dashboard = get_dashboard_overview(user_id)
    if not dashboard:
        return jsonify({"message": "User not found"}), 404
    return jsonify(dashboard), 200


@jwt_required()
def profile():
    user_id = get_jwt_identity()
    dashboard_profile = get_dashboard_profile(user_id)
    if not dashboard_profile:
        return jsonify({"message": "Dashboard profile not found"}), 404
    return jsonify({"profile": dashboard_profile}), 200


@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    payload = request.get_json(silent=True) or {}

    result = update_dashboard_profile(
        user_id,
        {
            "name": payload.get("name", payload.get("fullName")),
            "goal": payload.get("goal", ""),
            "user_type": payload.get("userType", payload.get("user_type", "")),
            "problems": payload.get("problems", []),
            "focus_areas": payload.get("focusAreas", payload.get("focus_areas", [])),
            "onboarding_completed": payload.get("onboardingCompleted", payload.get("onboarding_completed")),
        },
    )
    return jsonify(result), 200


@jwt_required()
def activity():
    user_id = get_jwt_identity()
    payload = request.get_json(silent=True) or {}
    result = record_activity(
        user_id,
        {
            "game_key": payload.get("gameKey", payload.get("game_key", "")),
            "title": payload.get("title", ""),
            "summary": payload.get("summary", ""),
            "score": payload.get("score", 0),
            "points_awarded": payload.get("pointsAwarded", payload.get("points_awarded", 0)),
            "focus_areas": payload.get("focusAreas", payload.get("focus_areas", [])),
            "gameplayMetadata": payload.get("gameplayMetadata", {}),
        },
    )
    if not result:
        return jsonify({"message": "Unable to record activity"}), 400
    return jsonify(result), 200
