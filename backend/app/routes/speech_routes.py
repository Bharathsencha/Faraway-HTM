from flask import Blueprint, request, jsonify, send_file
import io
import traceback
from app.services import speech_service

speech_bp = Blueprint('speech_routes', __name__, url_prefix='/api/speech')

@speech_bp.route('/tts', methods=['POST'])
def generate_tts():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"status": "error", "message": "Text is required"}), 400
            
        text = data['text']
        description = data.get('description', None)
        
        # Generate the audio (returns binary WAV)
        audio_data = speech_service.generate_speech(text, description)
        
        # Return as an audio file
        return send_file(
            io.BytesIO(audio_data),
            mimetype="audio/wav",
            as_attachment=False,
            download_name="tts.wav"
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
