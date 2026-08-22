from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services.auth_service import get_current_user, login_user, register_user

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip()
    name = str(payload.get("name", "")).strip()
    password = str(payload.get("password", "")).strip()

    if not email or not name or not password:
        return jsonify({"message": "email, name, and password are required"}), 400

    result, error = register_user(email=email, name=name, password=password)
    if error:
        return jsonify({"message": error}), 409

    return jsonify(result), 201


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip()
    password = str(payload.get("password", "")).strip()

    if not email or not password:
        return jsonify({"message": "email and password are required"}), 400

    result, error = login_user(email=email, password=password)
    if error:
        return jsonify({"message": error}), 401

    return jsonify(result), 200


@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = get_current_user(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({"user": user}), 200
