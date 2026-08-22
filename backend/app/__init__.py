import os
import json
from pathlib import Path

from datetime import timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from app.agents.genai_wrapper import genai_client, genai_available

# Optionally set API key via environment; wrapper will prefer installed SDKs
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if api_key:
    os.environ["GOOGLE_API_KEY"] = api_key

from app.extensions import jwt
from app.routes.dashboard_routes import dashboard_bp
from app.routes.auth_routes import auth_bp
from app.routes.game4_routes import game4_bp
from app.routes.game3_routes import game3_bp
from app.routes.game2_routes import game2_bp
from app.routes.coach_routes import coach_bp
from app.routes.interview_routes import interview_routes
from app.routes.speech_routes import speech_bp


def create_app() -> Flask:
    load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env")

    app = Flask(__name__)
    secret_key = os.getenv("SECRET_KEY")
    jwt_secret_key = os.getenv("JWT_SECRET_KEY") or os.getenv("JWT_SECRET")
    cors_origins = os.getenv("CORS_ORIGINS")

    if not secret_key:
        raise RuntimeError("SECRET_KEY is not set")
    if not jwt_secret_key:
        raise RuntimeError("JWT_SECRET_KEY is not set")
    if not cors_origins:
        raise RuntimeError("CORS_ORIGINS is not set")

    app.config["SECRET_KEY"] = secret_key
    app.config["JWT_SECRET_KEY"] = jwt_secret_key
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)
    app.config["JSON_SORT_KEYS"] = False

    CORS(app, resources={r"/api/*": {"origins": [origin.strip() for origin in cors_origins.split(",") if origin.strip()]}})

    jwt.init_app(app)
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(game4_bp)
    app.register_blueprint(game3_bp)
    app.register_blueprint(game2_bp)
    app.register_blueprint(coach_bp)
    app.register_blueprint(interview_routes)
    app.register_blueprint(speech_bp)

    @app.get("/api/health")
    def health_check():
        return {"status": "ok"}

    return app
