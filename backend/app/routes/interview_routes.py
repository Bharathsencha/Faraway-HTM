"""
Interview Routes - API routes for interview coaching system
"""

from flask import Blueprint
from app.controllers.interview_controller import InterviewController

interview_routes = Blueprint('interview', __name__, url_prefix='/api/interview')

# Routes
interview_routes.route('/parse-resume', methods=['POST'])(InterviewController.parse_resume)
interview_routes.route('/upload-resume', methods=['POST'])(InterviewController.upload_resume)
interview_routes.route('/generate-question', methods=['POST'])(InterviewController.generate_question)
interview_routes.route('/submit-answer', methods=['POST'])(InterviewController.submit_answer)
interview_routes.route('/progress', methods=['GET'])(InterviewController.get_user_progress)
interview_routes.route('/drills', methods=['GET'])(InterviewController.get_available_drills)
interview_routes.route('/drills/<drill_id>', methods=['GET'])(InterviewController.get_drill_details)
interview_routes.route('/badges', methods=['GET'])(InterviewController.get_badges)
