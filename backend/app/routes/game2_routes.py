from flask import Blueprint, request, jsonify
from app.controllers import game2_controller

game2_bp = Blueprint('game2_routes', __name__, url_prefix='/api/game2')

@game2_bp.route('/init', methods=['POST'])
def init_game():
    return game2_controller.init_session(request.get_json())

@game2_bp.route('/move', methods=['POST'])
def make_move():
    return game2_controller.process_move(request.get_json())