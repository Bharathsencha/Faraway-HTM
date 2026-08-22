"""
Agent 8: Drill Unlock Agent
Recommends and unlocks practice drills based on weak areas
"""

from typing import Dict, List

class DrillUnlockAgent:
    """Recommends targeted practice drills based on performance analysis"""
    
    # Available drills
    DRILLS = {
        'no_filler_sprint': {
            'id': 'no_filler_sprint',
            'name': '🚀 No-Filler Sprint',
            'description': 'Answer questions without using any filler words. Replace "um" with silence.',
            'duration': 30,
            'trigger': 'fillers_count > 3',
            'difficulty': 'medium',
            'benefits': ['Improves clarity', 'Builds confidence', 'More professional delivery'],
            'instructions': [
                '1. Read a question out loud',
                '2. Take 3 seconds to think',
                '3. Answer without any "um", "like", "basically", "you know"',
                '4. Replace fillers with strategic pauses',
                '5. Rate yourself: Did you use any fillers?',
            ]
        },
        'pace_metronome': {
            'id': 'pace_metronome',
            'name': '⏱️ Pace Metronome Drill',
            'description': 'Speak at a steady 120-150 words per minute using a metronome.',
            'duration': 45,
            'trigger': 'pace in ["very_fast", "slow"]',
            'difficulty': 'easy',
            'benefits': ['Consistent delivery', 'More persuasive', 'Professional tone'],
            'instructions': [
                '1. Set a metronome to 130 BPM',
                '2. Say one word per beat',
                '3. Practice synchronizing your speech',
                '4. Record and check your pace',
                '5. Repeat until comfortable',
            ]
        },
        'star_structure': {
            'id': 'star_structure',
            'name': '⭐ STAR Structure Drill',
            'description': 'Practice answering using Situation-Task-Action-Result format.',
            'duration': 60,
            'trigger': 'star_structure_score < 60',
            'difficulty': 'medium',
            'benefits': ['Clear storytelling', 'Better answers', 'Memorable responses'],
            'instructions': [
                '1. Get a question',
                '2. Spend 10 seconds planning your STAR response:',
                '   • Situation: What happened?',
                '   • Task: What was your responsibility?',
                '   • Action: What did YOU do specifically?',
                '   • Result: What was the outcome?',
                '3. Answer out loud (45 seconds)',
                '4. Record yourself',
                '5. Did you hit all 4 elements?',
            ]
        },
        'smooth_flow': {
            'id': 'smooth_flow',
            'name': '🌊 Smooth Flow Drill',
            'description': 'Practice minimizing pauses and speaking with natural rhythm.',
            'duration': 45,
            'trigger': 'long_pauses > 2',
            'difficulty': 'easy',
            'benefits': ['Reduced hesitation', 'More confident delivery', 'Better engagement'],
            'instructions': [
                '1. Pick a topic you know well',
                '2. Speak for 1 minute without stopping',
                '3. If you pause for > 1 second, restart',
                '4. Record and count pauses',
                '5. Try to reduce pauses by 50%',
            ]
        },
        'specificity_booster': {
            'id': 'specificity_booster',
            'name': '🎯 Specificity Booster',
            'description': 'Learn to add metrics, numbers, and concrete details to your answers.',
            'duration': 60,
            'trigger': 'specificity_score < 50',
            'difficulty': 'medium',
            'benefits': ['More credible answers', 'Shows impact', 'Memorable examples'],
            'instructions': [
                '1. Get a question',
                '2. First answer with vague language (30s)',
                '3. Rewrite adding:',
                '   • Specific numbers (e.g., "reduced by 40%")',
                '   • Timeframes (e.g., "within 2 weeks")',
                '   • Metrics (e.g., "user retention improved to 85%")',
                '4. Record both versions',
                '5. Compare impact',
            ]
        },
        'confidence_builder': {
            'id': 'confidence_builder',
            'name': '💪 Confidence Builder',
            'description': 'Build confidence with progressive challenges starting easy.',
            'duration': 90,
            'trigger': 'total_score < 50',
            'difficulty': 'hard',
            'benefits': ['Increased confidence', 'Better performance', 'Stress management'],
            'instructions': [
                '1. Start with 3 easy behavioral questions',
                '2. Answer each slowly and deliberately',
                '3. Review feedback and improve',
                '4. Progress to harder questions',
                '5. Celebrate small wins',
            ]
        },
        'pressure_practice': {
            'id': 'pressure_practice',
            'name': '🔥 Pressure Practice',
            'description': 'Practice with strict time limits to simulate real interviews.',
            'duration': 120,
            'trigger': 'total_score > 70',
            'difficulty': 'hard',
            'benefits': ['Better under pressure', 'Faster thinking', 'Interview ready'],
            'instructions': [
                '1. Get 5 random interview questions',
                '2. You have ONLY 30 seconds to answer each',
                '3. No planning time',
                '4. Answer immediately',
                '5. Record and score',
            ]
        },
    }
    
    @staticmethod
    def get_weak_areas(analysis: Dict) -> List[str]:
        """Identify weak areas from analysis"""
        weak_areas = []
        
        if analysis['fillers']['count'] > 3:
            weak_areas.append('fillers_count')
        
        if analysis['stutters']['count'] > 1:
            weak_areas.append('stutters')
        
        pace = analysis['pace']['classification']
        if pace in ['very_fast', 'slow']:
            weak_areas.append('pace')
        
        if analysis['relevance']['star_structure_score'] < 60:
            weak_areas.append('star_structure_score')
        
        if analysis['relevance']['specificity_score'] < 50:
            weak_areas.append('specificity_score')
        
        return weak_areas
    
    @staticmethod
    def unlock_drills(analysis: Dict) -> Dict:
        """Determine which drills to unlock based on performance"""
        
        weak_areas = DrillUnlockAgent.get_weak_areas(analysis)
        total_score = analysis['fluency_score']  # Using fluency as baseline
        
        unlocked_drills = []
        recommended_drills = []
        
        # Unlock drills based on weak areas
        if 'fillers_count' in weak_areas:
            unlocked_drills.append('no_filler_sprint')
            recommended_drills.append('no_filler_sprint')
        
        if 'pace' in weak_areas:
            unlocked_drills.append('pace_metronome')
            recommended_drills.append('pace_metronome')
        
        if 'star_structure_score' in weak_areas:
            unlocked_drills.append('star_structure')
            recommended_drills.append('star_structure')
        
        if 'stutters' in weak_areas:
            unlocked_drills.append('smooth_flow')
            recommended_drills.append('smooth_flow')
        
        if 'specificity_score' in weak_areas:
            unlocked_drills.append('specificity_booster')
        
        # Always unlock based on performance level
        if total_score < 50:
            unlocked_drills.append('confidence_builder')
            recommended_drills.insert(0, 'confidence_builder')
        elif total_score > 75:
            unlocked_drills.append('pressure_practice')
        
        # Remove duplicates
        unlocked_drills = list(set(unlocked_drills))
        
        # Get drill details
        drill_details = []
        for drill_id in unlocked_drills:
            if drill_id in DrillUnlockAgent.DRILLS:
                drill_details.append(DrillUnlockAgent.DRILLS[drill_id])
        
        return {
            'weak_areas': weak_areas,
            'unlocked_drills': drill_details,
            'recommended_drill': DrillUnlockAgent.DRILLS.get(recommended_drills[0]) if recommended_drills else None,
            'next_steps': [
                f"Try the '{drill['name']}' drill to improve {area.replace('_', ' ')}"
                for area, drill in zip(weak_areas, drill_details) if area in weak_areas
            ][:3]
        }
    
    @staticmethod
    def get_drill_details(drill_id: str) -> Dict:
        """Get full details of a specific drill"""
        return DrillUnlockAgent.DRILLS.get(drill_id)
    
    @staticmethod
    def get_all_drills() -> Dict:
        """Get all available drills"""
        return DrillUnlockAgent.DRILLS
