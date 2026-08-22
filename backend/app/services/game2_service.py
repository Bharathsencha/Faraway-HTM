import random
import re
import os
from app.agents.genai_wrapper import genai_client, genai_available

# Teammate's Hardcoded Market Data
MARKET_DATA = {
    "flipkart": {"min": 1500000, "max": 3000000, "avg": 2200000},
    "amazon": {"min": 2000000, "max": 4000000, "avg": 3000000},
    "swiggy": {"min": 1200000, "max": 2500000, "avg": 1800000}
}

def initialize_game(company_name, role, current_offer):
    company_key = company_name.lower().strip()
    
    # Fallback to dynamic math if company isn't in the hardcoded DB
    if company_key in MARKET_DATA:
        data = MARKET_DATA[company_key]
        min_range, max_range, market_avg = data["min"], data["max"], data["avg"]
    else:
        min_range = int(current_offer * 0.85)
        max_range = int(current_offer * 1.35)
        market_avg = int(min_range + (max_range - min_range) * 0.45)

    statuses = ['Series C ($45M raised)', 'Profitable (Bootstrapped)', 'IPO (Public)']
    freezes = ['No freeze (Hiring aggressively)', 'Selective hiring (Budget adjustments)']

    import uuid
    return {
        "sessionId": f"poker_{uuid.uuid4().hex[:8]}",
        "companyRange": {"min": min_range, "max": max_range},
        "fundingStatus": random.choice(statuses),
        "hiringFreezeInfo": random.choice(freezes),
        "marketAverage": market_avg,
        "baseSalary": current_offer
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
    prompt = f"""
    You are an HR Manager negotiating a salary. 
    Current Offer: {hr_counter_offer}. Candidate's Move: {move_type}.
    Your Persona: {hr_persona}.
    
    Respond directly to the candidate in exactly 2 short sentences. Be realistic and stay in character. Do not use markdown.
    """
    try:
        if genai_available:
            hr_response_text = genai_client.generate_text(prompt)
        else:
            raise Exception('genai not available')
    except Exception:
        hr_response_text = f"We have reviewed your {move_type}. Our revised position stands at {hr_counter_offer}."

    return {
        "hrResponse": hr_response_text,
        "hrCounterOffer": int(hr_counter_offer),
        "hrMoveType": hr_move_type,
        "salaryDelta": int(hr_counter_offer - base_salary),
        "isGameOver": is_game_over,
        "verdict": verdict,
        "feedback": feedback
    }