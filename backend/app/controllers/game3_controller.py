import os
import tempfile
from flask import jsonify, request
from app.services import game3_service
from app.agents import log_player_action

def start_session():
    # Return starting config matching the frontend expectations
    return jsonify({
        "status": "success",
        "data": {
            "timePerRound": 90,
            "totalLives": 3,
            "totalRounds": 5
        }
    }), 200

def evaluate_text(data):
    question_id = data.get('questionId', 'c1')
    answer = data.get('answer', '')
    
    if not answer:
        return jsonify({"status": "error", "message": "No answer provided"}), 400
        
    try:
        result = game3_service.run_multi_agent_evaluation(question_id, text_answer=answer)
        try:
            session_id = data.get("sessionId") or data.get("session_id")
            if session_id:
                log_player_action(session_id, {"type": "game3_text_eval", "payload": data})
        except Exception:
            pass
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def evaluate_audio(req):
    question_id = req.form.get('questionId', 'c1')
    audio_file = req.files.get('audio')
    
    if not audio_file:
        return jsonify({"status": "error", "message": "No audio file provided"}), 400

    try:
        # Save the audio blob securely to a temp file
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, f"temp_audio_{os.urandom(4).hex()}.webm")
        audio_file.save(temp_path)
        
        result = game3_service.run_multi_agent_evaluation(question_id, audio_path=temp_path)

        try:
            session_id = req.form.get("sessionId") or req.form.get("session_id")
            if session_id:
                log_player_action(session_id, {"type": "game3_audio_eval", "payload": {"questionId": question_id}})
        except Exception:
            pass
        
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return jsonify({"status": "success", "data": result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def transcribe_audio(req):
    audio_file = req.files.get('audio')
    if not audio_file:
        return jsonify({"status": "error", "message": "No audio file provided"}), 400

    try:
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, f"temp_transcribe_{os.urandom(4).hex()}.webm")
        audio_file.save(temp_path)
        
        transcript = game3_service.transcribe_audio_file(temp_path)

        try:
            session_id = req.form.get("sessionId") or req.form.get("session_id")
            if session_id:
                log_player_action(session_id, {"type": "transcribe", "payload": {"questionId": question_id}})
        except Exception:
            pass
        
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return jsonify({"status": "success", "transcript": transcript}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
        
def get_next_card(data):
    exclude_ids = data.get('excludeIds', [])
    level = data.get('level')
    result = game3_service.fetch_random_concept(exclude_ids, level)
    
    if not result:
        return jsonify({"status": "error", "message": "No more questions available"}), 404
        
    return jsonify({"status": "success", "data": result}), 200