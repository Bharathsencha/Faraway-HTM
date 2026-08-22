from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers import game4_controller

game4_bp = Blueprint('game4_routes', __name__, url_prefix='/api/game4')

@game4_bp.route('/start', methods=['POST'])
@jwt_required()
def start_game():
    user_id = get_jwt_identity()
    return game4_controller.start_session(user_id)

@game4_bp.route('/question/<int:round_num>', methods=['GET'])
@jwt_required()
def get_question(round_num):
    user_id = get_jwt_identity()
    return game4_controller.get_question_for_round(user_id, round_num)

@game4_bp.route('/evaluate', methods=['POST'])
@jwt_required()
def evaluate_answer():
    user_id = get_jwt_identity()
    data = request.get_json()
    return game4_controller.evaluate_player_answer(user_id, data)

@game4_bp.route('/lifeline', methods=['POST'])
@jwt_required()
def use_lifeline():
    user_id = get_jwt_identity()
    data = request.get_json()
    return game4_controller.process_lifeline(user_id, data)