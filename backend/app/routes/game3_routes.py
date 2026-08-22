from flask import Blueprint, request, jsonify
import json
import os
from app.agents.genai_wrapper import genai_client, genai_available
from app.controllers import game3_controller

game3_bp = Blueprint('game3_routes', __name__, url_prefix='/api/game3')

@game3_bp.route('/start', methods=['POST'])
def start():
    return game3_controller.start_session()

@game3_bp.route('/evaluate', methods=['POST'])
def evaluate():
    # Frontend sends multipart/form-data for audio, JSON for text
    if request.content_type and 'multipart/form-data' in request.content_type:
        return game3_controller.evaluate_audio(request)
    else:
        return game3_controller.evaluate_text(request.get_json())

@game3_bp.route('/transcribe', methods=['POST'])
def transcribe():
    return game3_controller.transcribe_audio(request)

@game3_bp.route('/next-card', methods=['POST'])
def next_card():
    return game3_controller.get_next_card(request.get_json() or {})

@game3_bp.route('/score', methods=['POST'])
def score_route():
    data = request.get_json() or {}
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
You are an expert technical interview coach.

Topic given: {data.get('topic')}
Difficulty: {data.get('level')}
User's speech: {data.get('transcript')}
Filler words detected: {data.get('filler_count')}

Return ONLY valid JSON, no extra text, no markdown:
{{
  "total_score": 75,
  "content_score": 28,
  "fluency_score": 24,
  "structure_score": 23,
  "filler_penalty": -5,
  "feedback": "one sentence what they did well",
  "improve": "one sentence what to fix next time",
  "better_line": "rewrite their weakest sentence better",
  "weak_filler": "the filler word they used most"
}}
"""
    try:
        if genai_available:
            text = genai_client.generate_text(prompt)
        else:
            raise Exception('genai not available')
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return jsonify(json.loads(text.strip())), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@game3_bp.route('/generate-topic', methods=['POST'])
def generate_topic_route():
    data = request.get_json() or {}
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
Generate 1 technical interview speaking topic.
Difficulty level: {data.get('level')}
Topics already used: {data.get('seen_topics')}

Rules:
- Must be a real technical concept
- Must be different from already used topics
- Must match the difficulty level exactly
- Return ONLY the topic sentence, nothing else
- Format: "Explain how X works" or "What is X and why is it used"

EASY = basic concepts (APIs, Git, Docker, databases)
MEDIUM = intermediate (JWT, microservices, caching, queues)
HARD = advanced (system design, distributed systems, CAP theorem)
GOD = expert (design at scale, fault tolerance, real-time systems)
"""
    try:
        if genai_available:
            txt = genai_client.generate_text(prompt)
            return jsonify({"topic": txt.strip()}), 200
        else:
            raise Exception('genai not available')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@game3_bp.route('/coach', methods=['POST'])
def coach_route():
    data = request.get_json() or {}
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
You are a technical interview speech coach.

Topic the user spoke about: {data.get('topic')}
Their transcript: {data.get('transcript')}
Their score: {data.get('score')}
User's question: {data.get('question')}

Answer in 2-3 sentences max.
Be specific and actionable.
Do not repeat the question back.
"""
    try:
        if genai_available:
            txt = genai_client.generate_text(prompt)
            return jsonify({"answer": txt.strip()}), 200
        else:
            raise Exception('genai not available')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@game3_bp.route('/update-profile', methods=['POST'])
def update_profile_route():
    data = request.get_json() or {}
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
Analyze this person's speech pattern across sessions.

All their transcripts this week: {data.get('all_transcripts')}
Their filler counts per session: {data.get('filler_history')}
Their scores per session: {data.get('score_history')}
Their worst filler word today: {data.get('weak_filler')}

Return ONLY valid JSON:
{{
  "top_filler": "basically",
  "trigger": "appears when explaining technical concepts",
  "pattern": "one sentence describing their speech pattern",
  "drill_focus": "what their next session should target"
}}
"""
    try:
        if genai_available:
            text = genai_client.generate_text(prompt)
        else:
            raise Exception('genai not available')
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return jsonify(json.loads(text.strip())), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@game3_bp.route('/warmup', methods=['POST'])
def warmup_route():
    data = request.get_json() or {}
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
Create a 30 second speech warmup drill.
User's worst filler word: {data.get('top_filler')}
Their speech pattern issue: {data.get('pattern')}

Return ONLY valid JSON:
{{
  "instruction": "one sentence telling them what to do",
  "drill_sentence": "a technical sentence for them to repeat out loud 3 times",
  "focus": "what to focus on while saying it"
}}
"""
    try:
        if genai_available:
            text = genai_client.generate_text(prompt)
        else:
            raise Exception('genai not available')
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return jsonify(json.loads(text.strip())), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500