"""
Interview Controller - Handles interview coaching API endpoints
"""

import io
from flask import request, jsonify
from app.agents.resume_parser import ResumeParser
from app.agents.question_generator import QuestionGenerator
from app.agents.answer_analyzer import AnswerAnalyzer
from app.agents.scoring_agent import ScoringAgent
from app.agents.feedback_agent import FeedbackAgent
from app.agents.drill_unlock_agent import DrillUnlockAgent
from app.agents.progress_tracker import ProgressTracker

# In-memory storage (in production, use database)
user_sessions = {}
user_history = {}

class InterviewController:
    """Handles interview coaching game endpoints"""
    
    @staticmethod
    def parse_resume():
        """
        POST /api/interview/parse-resume
        Parse pasted resume text and extract candidate profile
        """
        try:
            data = request.get_json() or {}
            resume_text = data.get('resume_text', '')
            user_id = data.get('user_id', 'anonymous')
            
            if not resume_text or len(resume_text.strip()) < 10:
                return jsonify({
                    'status': 'error',
                    'message': 'Resume text is too short (min 10 characters)'
                }), 400
            
            # Parse resume using AI / Heuristics
            profile = ResumeParser.parse(resume_text)
            
            return jsonify({
                'status': 'success',
                'profile': profile,
                'resume_text': resume_text,
                'user_id': user_id
            }), 200
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @staticmethod
    def upload_resume():
        """
        POST /api/interview/upload-resume
        Accept a PDF or TXT resume file upload, extract text, parse profile
        """
        try:
            if 'file' not in request.files:
                return jsonify({
                    'status': 'error',
                    'message': 'No file provided. Send a file with key "file".'
                }), 400
            
            file = request.files['file']
            
            if not file.filename:
                return jsonify({
                    'status': 'error',
                    'message': 'Empty filename'
                }), 400
            
            filename = file.filename.lower()
            user_id = request.form.get('user_id', 'anonymous')
            resume_text = ""
            
            # PDF File parsing
            if filename.endswith('.pdf'):
                try:
                    from pypdf import PdfReader
                    pdf_bytes = io.BytesIO(file.read())
                    reader = PdfReader(pdf_bytes)
                    
                    pages_text = []
                    for page in reader.pages:
                        text = page.extract_text()
                        if text:
                            pages_text.append(text.strip())
                    
                    resume_text = '\n'.join(pages_text)
                except ImportError:
                    return jsonify({
                        'status': 'error',
                        'message': 'PDF parsing library (pypdf) is not installed on the server.'
                    }), 500
                except Exception as pdf_err:
                    return jsonify({
                        'status': 'error',
                        'message': f'Failed to read PDF: {str(pdf_err)}'
                    }), 400
            # Text File parsing (.txt)
            elif filename.endswith('.txt'):
                try:
                    resume_text = file.read().decode('utf-8', errors='ignore')
                except Exception as txt_err:
                    return jsonify({
                        'status': 'error',
                        'message': f'Failed to read text file: {str(txt_err)}'
                    }), 400
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'Only .pdf and .txt files are supported.'
                }), 400
            
            if not resume_text or len(resume_text.strip()) < 10:
                return jsonify({
                    'status': 'error',
                    'message': 'Could not extract enough text from the file. The file may be image-based or empty.'
                }), 400
            
            # Parse the extracted text with AI
            profile = ResumeParser.parse(resume_text)
            
            return jsonify({
                'status': 'success',
                'resume_text': resume_text,
                'profile': profile,
                'user_id': user_id,
            }), 200
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @staticmethod
    def generate_question():
        """
        POST /api/interview/generate-question
        Generate a contextual question directly derived from candidate's uploaded resume profile
        """
        try:
            data = request.get_json() or {}
            profile = data.get('profile')
            user_id = data.get('user_id', 'anonymous')
            previous_questions = data.get('previous_questions', [])
            
            if not profile:
                return jsonify({
                    'status': 'error',
                    'message': 'Profile is required'
                }), 400
            
            # Generate resume-tailored question
            question, time_limit, q_type = QuestionGenerator.generate_question(
                profile, 
                previous_questions=previous_questions
            )
            
            # Create session
            session = ProgressTracker.create_session(user_id, question, q_type)
            session['profile'] = profile
            user_sessions[session['session_id']] = session
            
            return jsonify({
                'status': 'success',
                'session_id': session['session_id'],
                'question': question,
                'time_limit': time_limit,
                'question_type': q_type,
            }), 200
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @staticmethod
    def submit_answer():
        """
        POST /api/interview/submit-answer
        Submit answer and get scoring/feedback
        """
        try:
            data = request.get_json() or {}
            session_id = data.get('session_id')
            answer_text = data.get('answer')
            duration_seconds = data.get('duration', 45)
            user_id = data.get('user_id', 'anonymous')
            
            if not session_id or session_id not in user_sessions:
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid session_id'
                }), 400
            
            if not answer_text or len(answer_text.strip()) < 5:
                return jsonify({
                    'status': 'error',
                    'message': 'Answer is too short'
                }), 400
            
            session = user_sessions[session_id]
            question = session['question']
            
            # Analyze answer
            analysis = AnswerAnalyzer.analyze_full(answer_text, question, duration_seconds)
            
            # Calculate score
            score_result = ScoringAgent.calculate_score(analysis)
            final_score = score_result['total']
            
            # Generate feedback
            feedback = FeedbackAgent.generate_complete_feedback(answer_text, analysis, question)
            
            # Unlock drills
            drills = DrillUnlockAgent.unlock_drills(analysis)
            
            # Complete session
            ProgressTracker.complete_session(session, answer_text, duration_seconds, final_score, analysis)
            
            # Track history
            if user_id not in user_history:
                user_history[user_id] = []
            user_history[user_id].append(session)
            
            # Get progress
            progress = ProgressTracker.calculate_progress(user_history.get(user_id, []))
            badges = ProgressTracker.check_badges(user_history.get(user_id, []))
            
            return jsonify({
                'status': 'success',
                'score': final_score,
                'score_label': ScoringAgent.get_score_label(final_score),
                'score_breakdown': score_result['breakdown'],
                'analysis': {
                    'fillers': analysis['fillers']['count'],
                    'stutters': analysis['stutters']['count'],
                    'pace': analysis['pace']['classification'],
                    'words_per_minute': analysis['pace']['words_per_minute'],
                    'relevance_score': analysis['relevance']['relevance_score'],
                },
                'feedback': feedback,
                'recommended_drill': drills['recommended_drill'],
                'unlocked_drills': drills['unlocked_drills'],
                'progress': progress,
                'badges': badges,
            }), 200
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @staticmethod
    def get_user_progress():
        """
        GET /api/interview/progress?user_id=xxx
        Get user's progress, badges, and stats
        """
        try:
            user_id = request.args.get('user_id', 'anonymous')
            
            user_sessions_list = user_history.get(user_id, [])
            stats = ProgressTracker.get_user_stats(user_sessions_list)
            
            return jsonify({
                'status': 'success',
                'user_id': user_id,
                'stats': stats,
                'sessions_count': len(user_sessions_list),
            }), 200
        
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @staticmethod
    def get_available_drills():
        """
        GET /api/interview/drills
        Get all available practice drills
        """
        try:
            drills = DrillUnlockAgent.get_all_drills()
            
            return jsonify({
                'status': 'success',
                'drills': list(drills.values()),
                'total': len(drills)
            }), 200
        
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @staticmethod
    def get_drill_details(drill_id):
        """
        GET /api/interview/drills/<drill_id>
        Get details of a specific drill
        """
        try:
            drill = DrillUnlockAgent.get_drill_details(drill_id)
            
            if not drill:
                return jsonify({
                    'status': 'error',
                    'message': f'Drill "{drill_id}" not found'
                }), 404
            
            return jsonify({
                'status': 'success',
                'drill': drill
            }), 200
        
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
    
    @staticmethod
    def get_badges():
        """
        GET /api/interview/badges
        Get all available badges
        """
        try:
            badges = ProgressTracker.BADGES
            
            return jsonify({
                'status': 'success',
                'badges': list(badges.values()),
                'total': len(badges)
            }), 200
        
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
