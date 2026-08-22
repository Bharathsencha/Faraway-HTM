import json
import os
import random
from app.agents.genai_wrapper import genai_available

# Full pool of MCQ and Open questions by difficulty
QUESTION_POOL = [
    # EASY (User level 1-3)
    {
        "id": "easy_1",
        "type": "mcq",
        "category": "Databases",
        "difficulty": "easy",
        "questionText": "What is the primary advantage of database normalization?",
        "options": [
            {"id": "a", "text": "It reduces data redundancy and improves data integrity."},
            {"id": "b", "text": "It speeds up read operations by duplicating tables."},
            {"id": "c", "text": "It eliminates the need for primary keys."},
            {"id": "d", "text": "It automatically indexes all text columns."}
        ],
        "correct_id": "a",
        "trap_id": "b"
    },
    {
        "id": "easy_2",
        "type": "open",
        "category": "Basic Coding",
        "difficulty": "easy",
        "questionText": "Explain the concept of 'Recursion' in programming and name its critical requirement to prevent infinite loops."
    },
    {
        "id": "easy_3",
        "type": "mcq",
        "category": "Git",
        "difficulty": "easy",
        "questionText": "What does 'git merge --squash' do?",
        "options": [
            {"id": "a", "text": "It deletes all branches except main."},
            {"id": "b", "text": "It combines all commits from a branch into a single commit on the target branch."},
            {"id": "c", "text": "It force-pushes changes to the remote repository."},
            {"id": "d", "text": "It automatically resolves merge conflicts using AI."}
        ],
        "correct_id": "b",
        "trap_id": "c"
    },
    # MEDIUM (User level 4-6)
    {
        "id": "medium_1",
        "type": "mcq",
        "category": "Databases",
        "difficulty": "medium",
        "questionText": "If you have a 10TB database and need to migrate it to a new schema with zero downtime, what is the most critical first step?",
        "options": [
            {"id": "a", "text": "Take a full backup and lock the tables."},
            {"id": "b", "text": "Create a dual-write mechanism."},
            {"id": "c", "text": "Setup logical replication to a new instance."},
            {"id": "d", "text": "Write a background script to update rows in batches."}
        ],
        "correct_id": "c",
        "trap_id": "d"
    },
    {
        "id": "medium_2",
        "type": "open",
        "category": "Backend Performance",
        "difficulty": "medium",
        "questionText": "What is the 'N+1 query problem' in Object-Relational Mapping (ORM) tools, and how do you resolve it?"
    },
    {
        "id": "medium_3",
        "type": "mcq",
        "category": "Concurrency",
        "difficulty": "medium",
        "questionText": "What is a 'deadlock' in multithreaded systems?",
        "options": [
            {"id": "a", "text": "When a thread crashes due to stack overflow."},
            {"id": "b", "text": "When two or more threads are blocked forever, each waiting for the resource held by the other."},
            {"id": "c", "text": "When a CPU core gets overheated and stops executing code."},
            {"id": "d", "text": "When database connections are left open."}
        ],
        "correct_id": "b",
        "trap_id": "a"
    },
    # HARD (User level 7-9)
    {
        "id": "hard_1",
        "type": "open",
        "category": "System Design",
        "difficulty": "hard",
        "questionText": "How would you design a scalable distributed rate-limiting system for a public API with millions of users?"
    },
    {
        "id": "hard_2",
        "type": "mcq",
        "category": "Security",
        "difficulty": "hard",
        "questionText": "Which hashing scheme is widely recommended for hashing passwords securely in modern web applications to prevent GPU cracking?",
        "options": [
            {"id": "a", "text": "SHA-256 with a unique salt."},
            {"id": "b", "text": "MD5 combined with encryption."},
            {"id": "c", "text": "Argon2id or bcrypt with high work factor."},
            {"id": "d", "text": "AES-256 symmetric encryption."}
        ],
        "correct_id": "c",
        "trap_id": "a"
    },
    # BOSS (User level 10)
    {
        "id": "boss_1",
        "type": "mcq",
        "category": "System Design",
        "difficulty": "boss",
        "questionText": "The Final Googly: You are designing a globally distributed counter. A network partition occurs. Do you prioritize Availability or Consistency?",
        "options": [
            {"id": "a", "text": "Availability, users need to see a number."},
            {"id": "b", "text": "Consistency, financial data requires it."},
            {"id": "c", "text": "Neither, CAP theorem forces a tradeoff that degrades both."},
            {"id": "d", "text": "CP systems fall back to AP to preserve uptime."}
        ],
        "correct_id": "c",
        "trap_id": "d"
    },
    {
        "id": "boss_2",
        "type": "open",
        "category": "Distributed Systems",
        "difficulty": "boss",
        "questionText": "How do you achieve absolute event ordering in a highly distributed system without relying on synchronized physical clocks?"
    }
]


def initialize_game(level):
    return {
        "totalRounds": 3,
        "startingRating": 50
    }


def fetch_question_for_level(level, round_num, seen_ids=[]):
    # Map level to difficulty string
    if level >= 10:
        difficulty = "boss"
    elif level >= 7:
        difficulty = "hard"
    elif level >= 4:
        difficulty = "medium"
    else:
        difficulty = "easy"

    # Filter by difficulty
    questions = [q for q in QUESTION_POOL if q["difficulty"] == difficulty]

    # Exclude already seen questions in this session
    unseen = [q for q in questions if q["id"] not in seen_ids]

    # Fallback to seen if everything at this difficulty is exhausted
    if not unseen:
        unseen = questions

    # Absolute fallback to the entire pool
    if not unseen:
        unseen = QUESTION_POOL

    selected = random.choice(unseen)
    q_data = selected.copy()

    # Strip answers for MCQ
    q_data.pop("correct_id", None)
    q_data.pop("trap_id", None)
    return q_data


def evaluate_with_agent(question_id, selected_option, open_answer, confidence_bet, current_rating):
    # Find question
    question = next((q for q in QUESTION_POOL if q["id"] == question_id), None)
    if not question:
        raise ValueError("Invalid question ID")

    is_mcq = question["type"] == "mcq"

    if is_mcq:
        selected_text = next((opt['text'] for opt in question['options'] if opt['id'] == selected_option), "Unknown")
        is_correct = selected_option == question["correct_id"]
        is_trap = selected_option == question.get("trap_id")

        prompt = f"""
        You are the "Googly Master", an elite, slightly ruthless Tech Lead interviewing a candidate.
        
        The Question: "{question['questionText']}"
        The Candidate Chose: "{selected_text}"
        
        Context for you: This answer is strictly {'CORRECT' if is_correct else 'INCORRECT'}. 
        {'This was a TRAP option.' if is_trap else ''}
        
        Your task is to generate feedback.
        1. 'trapExplanation': If they hit a trap, explain in 2 sentences why it looked right but is technically disastrous. If they got it right, praise their system design thinking in 1 sentence.
        2. 'playerInsight': A harsh but fair 1-sentence critique or compliment of their architectural understanding.
        
        Output ONLY a valid JSON object matching this schema exactly:
        {{
            "trapExplanation": "string",
            "playerInsight": "string"
        }}
        """
    else:
        prompt = f"""
        You are the "Googly Master", an elite, slightly ruthless Tech Lead interviewing a candidate.
        
        The Question: "{question['questionText']}"
        The Candidate Answered: "{open_answer}"
        
        Your task is to evaluate this open-ended response. Grade it on a scale of 0 to 100 based on technical accuracy, clarity, and system design maturity.
        Determine if this is a correct response (score >= 70).
        
        Generate the evaluation feedback matching this schema exactly:
        1. 'score': integer from 0 to 100.
        2. 'isCorrect': boolean (true if score >= 70, false otherwise).
        3. 'trapExplanation': Explain common pitfalls/traps associated with this question (2 sentences).
        4. 'playerInsight': A harsh but fair 1-sentence critique or compliment of their response.
        5. 'idealResponse': A concise 2-sentence summary of the ideal response.
        
        Output ONLY a valid JSON object matching this schema exactly:
        {{
            "score": number,
            "isCorrect": boolean,
            "trapExplanation": "string",
            "playerInsight": "string",
            "idealResponse": "string"
        }}
        """

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )

        raw_text = response.text.strip()
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]

        ai_data = json.loads(raw_text.strip())
        print("AI Evaluation Successful!")
    except Exception as e:
        print(f"🚨 CRITICAL AI ERROR: {str(e)}")
        # Fallback values
        if is_mcq:
            ai_data = {
                "trapExplanation": "Evaluation service timeout, logged answer.",
                "playerInsight": "Network timeout during AI evaluation."
            }
        else:
            ai_data = {
                "score": 50,
                "isCorrect": False,
                "trapExplanation": "Evaluation service timeout, logged answer.",
                "playerInsight": "Network timeout during AI evaluation.",
                "idealResponse": "A proper system design breakdown was expected."
            }

    if is_mcq:
        bonus = 50 if (confidence_bet == 3 and is_correct) else 0
        delta = 15 if is_correct else (-20 if is_trap else -5)
        xp = (100 if is_correct else 10) + bonus

        return {
            "correctOptionId": question["correct_id"],
            "trapOptionId": question.get("trap_id") if is_trap else None,
            "isCorrect": is_correct,
            "isTrap": is_trap,
            "trapExplanation": ai_data.get("trapExplanation", ""),
            "playerInsight": ai_data.get("playerInsight", ""),
            "ratingDelta": delta,
            "newRating": max(0, min(100, current_rating + delta)),
            "confidenceBonus": bonus,
            "totalXpAwarded": xp
        }
    else:
        is_correct = bool(ai_data.get("isCorrect", False))
        score = int(ai_data.get("score", 50))
        bonus = 50 if (confidence_bet == 3 and is_correct) else 0
        delta = 15 if is_correct else -10
        xp = (100 if is_correct else 10) + bonus

        return {
            "isCorrect": is_correct,
            "isTrap": not is_correct,
            "score": score,
            "trapExplanation": ai_data.get("trapExplanation", ""),
            "playerInsight": ai_data.get("playerInsight", ""),
            "idealResponse": ai_data.get("idealResponse", ""),
            "ratingDelta": delta,
            "newRating": max(0, min(100, current_rating + delta)),
            "confidenceBonus": bonus,
            "totalXpAwarded": xp
        }


def generate_lifeline(question_id, lifeline_type):
    question = next((q for q in QUESTION_POOL if q["id"] == question_id), None)
    if not question:
        raise ValueError("Invalid question ID")

    if lifeline_type == '50_50':
        if question["type"] == "mcq":
            all_ids = [opt['id'] for opt in question['options']]
            wrong_ids = [i for i in all_ids if i != question['correct_id']]
            return {"eliminated": wrong_ids[:2]}
        return {"eliminated": []}
    elif lifeline_type == 'hint':
        return {"hintText": "Don't fall for the obvious answer. Think about edge cases under heavy load."}