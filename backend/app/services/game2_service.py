import random
import re
import os
import json
import uuid
import requests
from groq import Groq
from datetime import datetime

# Teammate's Hardcoded Market Data (fast cache for known companies)
MARKET_DATA = {
    "flipkart": {"min": 1500000, "max": 3000000, "avg": 2200000},
    "amazon": {"min": 2000000, "max": 4000000, "avg": 3000000},
    "swiggy": {"min": 1200000, "max": 2500000, "avg": 1800000}
}


def _fetch_tavily_salary_data(company, role):
    """
    Queries Tavily Search API with multiple targeted queries,
    then feeds the combined results into the Groq LLM to extract
    a structured salary prediction.
    Returns dict with keys: min, max, avg, confidence, sources, reasoning
    Returns None on any failure.
    """
    tavily_key = os.getenv("TAVILY_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    if not tavily_key or not groq_key:
        print("[Tavily] Missing TAVILY_API_KEY or GROQ_API_KEY")
        return None

    current_year = datetime.now().year

    # --- Step 1: Multi-query Tavily search ---
    queries = [
        f"{company} {role} salary India {current_year}",
        f"{company} {role} salary package India glassdoor ambitionbox",
        f"{role} salary range India levels.fyi OR payscale {current_year}",
    ]

    all_results = []
    tavily_answer = ""

    for query in queries:
        try:
            resp = requests.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": tavily_key,
                    "query": query,
                    "search_depth": "advanced",
                    "include_answer": True,
                    "max_results": 5,
                    "include_domains": [
                        "glassdoor.com",
                        "ambitionbox.com",
                        "payscale.com",
                        "levels.fyi",
                    ],
                },
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()

            # Collect the synthesized answer from the first query that has one
            if not tavily_answer and data.get("answer"):
                tavily_answer = data["answer"]

            for r in data.get("results", []):
                all_results.append(
                    {"title": r.get("title", ""), "content": r.get("content", "")}
                )
        except Exception as e:
            print(f"[Tavily] Query failed: {query!r} — {e}")
            continue

    if not all_results:
        print("[Tavily] No search results returned from any query")
        return None

    # Deduplicate by title
    seen_titles = set()
    unique_results = []
    for r in all_results:
        if r["title"] not in seen_titles:
            seen_titles.add(r["title"])
            unique_results.append(r)

    # --- Step 2: Feed into LLM for structured extraction ---
    search_text = "\n".join(
        [f"- {r['title']}: {r['content']}" for r in unique_results[:10]]
    )

    prompt = f"""You are a salary research analyst. Based on the following search results about "{role}" salaries at "{company}" in India, provide a realistic salary range in Indian Lakhs per annum (LPA).

Search results:
{search_text}

Tavily's synthesized answer: {tavily_answer}

Respond ONLY in valid JSON with no extra text:
{{
  "min_salary_lakh": <number>,
  "max_salary_lakh": <number>,
  "median_salary_lakh": <number>,
  "confidence": "high" | "medium" | "low",
  "sources_used": ["source names"],
  "reasoning": "one sentence"
}}"""

    try:
        client = Groq(api_key=groq_key)
        completion = client.chat.completions.create(
            model="qwen/qwen3.6-27b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"},
        )
        raw = completion.choices[0].message.content.strip()
        # Strip Qwen's <think>...</think> reasoning blocks
        raw = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
        parsed = json.loads(raw)

        min_lakh = float(parsed["min_salary_lakh"])
        max_lakh = float(parsed["max_salary_lakh"])
        median_lakh = float(parsed["median_salary_lakh"])

        print(
            f"[Tavily+LLM] {company} / {role}: "
            f"₹{min_lakh}L – ₹{max_lakh}L (median ₹{median_lakh}L) "
            f"[{parsed.get('confidence', '?')}]"
        )

        return {
            "min": int(min_lakh * 100000),
            "max": int(max_lakh * 100000),
            "avg": int(median_lakh * 100000),
            "confidence": parsed.get("confidence", "low"),
            "sources": parsed.get("sources_used", []),
            "reasoning": parsed.get("reasoning", ""),
        }
    except Exception as e:
        print(f"[Tavily+LLM] Extraction failed: {e}")
        return None


def initialize_game(company_name, role, current_offer):
    company_key = company_name.lower().strip()

    # 1. Check the fast hardcoded cache first
    if company_key in MARKET_DATA:
        data = MARKET_DATA[company_key]
        min_range, max_range, market_avg = data["min"], data["max"], data["avg"]
        salary_source = "hardcoded"
        salary_meta = {}
    else:
        # 2. Try dynamic Tavily + LLM fetch
        dynamic = _fetch_tavily_salary_data(company_name, role)

        if dynamic:
            min_range = dynamic["min"]
            max_range = dynamic["max"]
            market_avg = dynamic["avg"]
            salary_source = "tavily"
            salary_meta = {
                "confidence": dynamic.get("confidence"),
                "sources": dynamic.get("sources", []),
                "reasoning": dynamic.get("reasoning", ""),
            }
        else:
            # 3. Fallback to percentage-based math
            min_range = int(current_offer * 0.85)
            max_range = int(current_offer * 1.35)
            market_avg = int(min_range + (max_range - min_range) * 0.45)
            salary_source = "fallback"
            salary_meta = {}

    statuses = ['Series C ($45M raised)', 'Profitable (Bootstrapped)', 'IPO (Public)']
    freezes = ['No freeze (Hiring aggressively)', 'Selective hiring (Budget adjustments)']

    return {
        "sessionId": f"poker_{uuid.uuid4().hex[:8]}",
        "companyRange": {"min": min_range, "max": max_range},
        "fundingStatus": random.choice(statuses),
        "hiringFreezeInfo": random.choice(freezes),
        "marketAverage": market_avg,
        "baseSalary": current_offer,
        "salarySource": salary_source,
        "salaryMeta": salary_meta,
    }

def calculate_move(data):
    round_num = data['round']
    move_type = data['moveType']
    counter_amt = float(data.get('counterAmount') or 0)
    history = data.get('history', [])
    base_salary = float(data['baseSalary'])
    company_max = float(data['companyRange']['max'])
    market_avg = float(data['marketAverage'])
    
    current_hr_offer = history[-1]['hrCounterOffer'] if history else base_salary
    
    # Default State
    hr_counter_offer = current_hr_offer
    hr_move_type = 'counter'
    is_game_over = False
    verdict = None
    feedback = ""
    hr_persona = "Standard HR Response"
    
    # --- RULE 1: INSTANT END CONDITIONS ---
    walk_count = sum(1 for h in history if h['moveType'] == 'walk') + (1 if move_type == 'walk' else 0)
    
    if move_type == 'walk' and round_num == 1:
        is_game_over, verdict, hr_move_type = True, 'fail', 'reject'
        feedback = "You walked away in Round 1. Game over."
        hr_persona = "Offended HR who is immediately withdrawing the offer."
    
    elif walk_count >= 2:
        is_game_over, verdict, hr_move_type = True, 'fail', 'reject'
        feedback = "You threatened to walk away too many times. They called your bluff."
        hr_persona = "Firm HR stating they are moving on to other candidates."
        
    elif move_type == 'counter' and counter_amt > (company_max * 1.6):
        is_game_over, verdict, hr_move_type = True, 'fail', 'reject'
        feedback = "Your counter was over 60% above max budget. You priced yourself out."
        hr_persona = "Shocked HR stating expectations are too far apart."

    # --- RULE 2 & 4: CALCULATE POT & HR CARD IF GAME CONTINUES ---
    if not is_game_over:
        if move_type == 'counter':
            hr_persona = "Band Block - refuse to go much higher."
            # Pot stays the same, or small bump
            hr_counter_offer = current_hr_offer + (counter_amt - current_hr_offer) * 0.2
            
            # Warning: Countering lower than previous
            prev_counters = [h['counterAmount'] for h in history if h['moveType'] == 'counter' and h.get('counterAmount')]
            if prev_counters and counter_amt < prev_counters[-1]:
                hr_counter_offer -= 100000 # Reduce pot by 1 Lakh

        elif move_type == 'justify':
            # Validation check
            user_text = data.get('userInput', '') # Assuming frontend passes this eventually
            has_numbers = bool(re.search(r'\d', user_text))
            word_count = len(user_text.split())
            
            if word_count < 10 or not has_numbers:
                feedback = "Warning: Weak justification. You need data and numbers to move the needle."
                hr_persona = "Unimpressed HR asking for market data."
            else:
                hr_persona = "Good Cop - impressed by the data."
                hr_counter_offer = current_hr_offer + 150000 # +1.5 Lakh

        elif move_type == 'trade':
            hr_persona = "Flexible HR offering alternative benefits."
            hr_counter_offer = current_hr_offer + 50000
            
        elif move_type == 'walk':
            hr_persona = "Panicked HR offering a big jump to keep you."
            hr_counter_offer = current_hr_offer + 300000 # +3 Lakh

    # --- END OF GAME CALCULATIONS (Round 4) ---
    if round_num >= 4 and not is_game_over:
        is_game_over = True
        hr_move_type = 'accept'
        if hr_counter_offer >= market_avg:
            verdict = 'win'
            feedback = "You beat the market average! Solid negotiation."
        elif hr_counter_offer > base_salary:
            verdict = 'partial_win'
            feedback = "You got an increase, but stayed below market average."
        else:
            verdict = 'lose'
            feedback = "You failed to increase the starting offer."

    # Prevent going over company absolute max unless perfect win
    if hr_counter_offer >= company_max:
        hr_counter_offer = company_max
        if not is_game_over:
            is_game_over, verdict, hr_move_type = True, 'perfect_win', 'accept'
            feedback = "You maxed out their budget completely!"

    # --- RULE 3: AI GENERATION FOR HR DIALOGUE ---
    prompt = f"""You are an HR Manager negotiating a salary package.
Current Offer: {hr_counter_offer}. Candidate's Move: {move_type}.
Persona: {hr_persona}.

Output ONLY your spoken response to the candidate. Exactly 1 to 2 concise, professional sentences. No preamble, no chain of thought, no formatting."""
    
    try:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("No Groq API key available")
            
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model="qwen/qwen3.6-27b",
            messages=[
                {"role": "system", "content": "You are a professional HR manager in a salary negotiation. Always respond in 1-2 clear, direct sentences without showing your thinking or markdown."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            stream=False
        )
        hr_response_text = completion.choices[0].message.content.strip()
        
        # Clean think tags and anything before closing think tag
        if '</think>' in hr_response_text:
            hr_response_text = hr_response_text.split('</think>')[-1].strip()
        else:
            hr_response_text = re.sub(r'<think>.*?</think>', '', hr_response_text, flags=re.DOTALL).strip()
            
        # Clean markdown formatting & quotes
        hr_response_text = re.sub(r'\*\*([^*]+)\*\*', r'\1', hr_response_text)
        hr_response_text = re.sub(r'\*([^*]+)\*', r'\1', hr_response_text)
        hr_response_text = hr_response_text.replace('"', '').strip()
        
        if not hr_response_text:
            hr_response_text = f"We have reviewed your position. Our updated offer is {int(hr_counter_offer)}."
        
    except Exception as e:
        print(f"Groq API Error: {e}")
        hr_response_text = f"We have reviewed your {move_type}. Our revised position stands at {int(hr_counter_offer)}."

    # --- TTS: Generate audio for the HR response ---
    hr_audio_b64 = None
    try:
        from app.services.speech_service import generate_speech
        import base64
        audio_bytes = generate_speech(
            hr_response_text,
            "A confident female HR manager speaking in a professional and calm tone."
        )
        hr_audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
    except Exception as e:
        print(f"TTS Error for HR response: {e}")

    return {
        "hrResponse": hr_response_text,
        "hrCounterOffer": int(hr_counter_offer),
        "hrMoveType": hr_move_type,
        "salaryDelta": int(hr_counter_offer - base_salary),
        "isGameOver": is_game_over,
        "verdict": verdict,
        "feedback": feedback,
        "hrAudio": hr_audio_b64,
    }