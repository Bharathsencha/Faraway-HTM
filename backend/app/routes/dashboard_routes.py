from flask import Blueprint

from app.controllers.dashboard_controller import overview, profile, update_profile, activity

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


dashboard_bp.get("/overview")(overview)
dashboard_bp.get("/profile")(profile)
dashboard_bp.put("/profile")(update_profile)
dashboard_bp.post("/activity")(activity)
