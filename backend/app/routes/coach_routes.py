from flask import Blueprint, request
from app.controllers import coach_controller

coach_bp = Blueprint('coach_routes', __name__, url_prefix='/api/coach')


@coach_bp.route('/report', methods=['POST'])
def report():
    return coach_controller.analyze_report()
