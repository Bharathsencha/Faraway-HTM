"""
Agent 9: Progress Tracker Agent
Tracks scores, improvements, streaks, and awards badges
"""

from typing import Dict, List
from datetime import datetime

class ProgressTracker:
    """Tracks interview practice progress and awards achievements"""
    
    # Available badges
    BADGES = {
        'no_filler_bronze': {
            'id': 'no_filler_bronze',
            'name': '🥉 No-Filler Bronze',
            'description': 'Complete an answer with ≤1 filler words',
            'icon': '🥉',
            'rarity': 'common'
        },
        'no_filler_silver': {
            'id': 'no_filler_silver',
            'name': '🥈 No-Filler Silver',
            'description': '3 answers in a row with ≤1 fillers',
            'icon': '🥈',
            'rarity': 'uncommon'
        },
        'no_filler_gold': {
            'id': 'no_filler_gold',
            'name': '🏆 No-Filler Gold',
            'description': '5 answers in a row with 0 fillers',
            'icon': '🏆',
            'rarity': 'rare'
        },
        'calm_under_pressure': {
            'id': 'calm_under_pressure',
            'name': '😌 Calm Under Pressure',
            'description': 'Score ≥80 on a hard question',
            'icon': '😌',
            'rarity': 'rare'
        },
        'speed_talker': {
            'id': 'speed_talker',
            'name': '⚡ Speed Talker',
            'description': 'Maintain perfect pace in 5 consecutive answers',
            'icon': '⚡',
            'rarity': 'uncommon'
        },
        'star_performer': {
            'id': 'star_performer',
            'name': '⭐ STAR Performer',
            'description': 'Perfect STAR structure in 3 answers',
            'icon': '⭐',
            'rarity': 'uncommon'
        },
        'specific_master': {
            'id': 'specific_master',
            'name': '🎯 Specific Master',
            'description': 'Achieve ≥90 specificity score',
            'icon': '🎯',
            'rarity': 'uncommon'
        },
        'consistency_king': {
            'id': 'consistency_king',
            'name': '👑 Consistency King',
            'description': 'Score ≥75 on 10 consecutive answers',
            'icon': '👑',
            'rarity': 'legendary'
        },
        'perfect_score': {
            'id': 'perfect_score',
            'name': '💯 Perfect Score',
            'description': 'Achieve 100 points on any question',
            'icon': '💯',
            'rarity': 'legendary'
        },
        'first_step': {
            'id': 'first_step',
            'name': '🚶 First Step',
            'description': 'Complete your first practice question',
            'icon': '🚶',
            'rarity': 'common'
        },
        'ten_timer': {
            'id': 'ten_timer',
            'name': '🔟 Ten Timer',
            'description': 'Complete 10 practice questions',
            'icon': '🔟',
            'rarity': 'uncommon'
        },
        'hundred_hour': {
            'id': 'hundred_hour',
            'name': '💪 Hundred Hour',
            'description': 'Accumulate 100+ minutes of practice',
            'icon': '💪',
            'rarity': 'rare'
        },
    }
    
    @staticmethod
    def create_session(user_id: str, question: str, question_type: str) -> Dict:
        """Create a new practice session"""
        return {
            'user_id': user_id,
            'session_id': f"{user_id}_{datetime.now().timestamp()}",
            'created_at': datetime.now().isoformat(),
            'question': question,
            'question_type': question_type,
            'answer': None,
            'duration_seconds': None,
            'score': None,
            'analysis': None,
            'completed': False
        }
    
    @staticmethod
    def complete_session(session: Dict, answer: str, duration: int, score: int, analysis: Dict) -> Dict:
        """Mark session as complete with results"""
        session['answer'] = answer
        session['duration_seconds'] = duration
        session['score'] = score
        session['analysis'] = analysis
        session['completed'] = True
        session['completed_at'] = datetime.now().isoformat()
        return session
    
    @staticmethod
    def check_badges(user_history: List[Dict]) -> Dict:
        """Check which badges user has earned"""
        earned_badges = []
        
        if not user_history:
            return {'earned': [], 'new_badges': []}
        
        # Count recent sessions
        recent_sessions = user_history[-10:] if len(user_history) > 10 else user_history
        
        # Badge: First Step
        if len(user_history) >= 1:
            earned_badges.append('first_step')
        
        # Badge: Ten Timer
        if len(user_history) >= 10:
            earned_badges.append('ten_timer')
        
        # Badge: No-Filler Bronze (≤1 fillers)
        for session in recent_sessions:
            if session.get('analysis', {}).get('fillers', {}).get('count', 0) <= 1:
                earned_badges.append('no_filler_bronze')
                break
        
        # Badge: No-Filler Silver (3 in a row)
        filler_streak = 0
        for session in reversed(user_history):
            if session.get('analysis', {}).get('fillers', {}).get('count', 0) <= 1:
                filler_streak += 1
                if filler_streak >= 3:
                    earned_badges.append('no_filler_silver')
                    break
            else:
                filler_streak = 0
        
        # Badge: No-Filler Gold (5 in a row with 0)
        zero_filler_streak = 0
        for session in reversed(user_history):
            if session.get('analysis', {}).get('fillers', {}).get('count', 0) == 0:
                zero_filler_streak += 1
                if zero_filler_streak >= 5:
                    earned_badges.append('no_filler_gold')
                    break
            else:
                zero_filler_streak = 0
        
        # Badge: Perfect Score (100 points)
        for session in user_history:
            if session.get('score') == 100:
                earned_badges.append('perfect_score')
                break
        
        # Badge: Calm Under Pressure
        for session in user_history:
            if session.get('score', 0) >= 80:
                earned_badges.append('calm_under_pressure')
                break
        
        # Badge: STAR Performer
        star_count = sum(1 for s in user_history 
                        if s.get('analysis', {}).get('relevance', {}).get('star_structure_score', 0) >= 90)
        if star_count >= 3:
            earned_badges.append('star_performer')
        
        # Badge: Speed Talker
        pace_count = sum(1 for s in reversed(user_history[:5])
                        if s.get('analysis', {}).get('pace', {}).get('classification') == 'normal')
        if pace_count >= 5:
            earned_badges.append('speed_talker')
        
        # Badge: Consistency King
        consistency_count = sum(1 for s in reversed(user_history[:10])
                               if s.get('score', 0) >= 75)
        if consistency_count >= 10:
            earned_badges.append('consistency_king')
        
        # Remove duplicates
        earned_badges = list(set(earned_badges))
        
        # Get badge details
        badge_details = [ProgressTracker.BADGES[b] for b in earned_badges if b in ProgressTracker.BADGES]
        
        return {
            'earned': badge_details,
            'total_badges': len(earned_badges),
            'badge_ids': earned_badges
        }
    
    @staticmethod
    def calculate_progress(user_history: List[Dict]) -> Dict:
        """Calculate progress metrics"""
        
        if not user_history:
            return {
                'total_attempts': 0,
                'total_minutes': 0,
                'average_score': 0,
                'best_score': 0,
                'improvement': 0,
                'current_streak': 0,
                'longest_streak': 0,
                'xp_earned': 0,
            }
        
        total_attempts = len(user_history)
        total_seconds = sum(s.get('duration_seconds', 0) for s in user_history)
        total_minutes = int(total_seconds / 60)
        
        scores = [s.get('score', 0) for s in user_history if s.get('completed')]
        average_score = int(sum(scores) / len(scores)) if scores else 0
        best_score = max(scores) if scores else 0
        
        # Calculate improvement (first 3 vs last 3)
        if len(scores) >= 3:
            first_avg = sum(scores[:3]) / 3
            last_avg = sum(scores[-3:]) / 3
            improvement = int(last_avg - first_avg)
        else:
            improvement = 0
        
        # Calculate streak
        current_streak = 0
        longest_streak = 0
        
        for session in reversed(user_history):
            if session.get('score', 0) >= 70:
                current_streak += 1
                longest_streak = max(longest_streak, current_streak)
            else:
                current_streak = 0
        
        # XP Calculation
        xp_earned = (
            total_attempts * 10 +      # 10 XP per attempt
            best_score +                # XP equal to best score
            (improvement * 5) +         # 5 XP per point of improvement
            (current_streak * 25)       # 25 XP per streak point
        )
        
        return {
            'total_attempts': total_attempts,
            'total_minutes': total_minutes,
            'average_score': average_score,
            'best_score': best_score,
            'improvement': improvement,
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'xp_earned': xp_earned,
            'level': int(xp_earned / 500) + 1,  # Level up every 500 XP
        }
    
    @staticmethod
    def get_user_stats(user_history: List[Dict]) -> Dict:
        """Get comprehensive user statistics"""
        
        progress = ProgressTracker.calculate_progress(user_history)
        badges = ProgressTracker.check_badges(user_history)
        
        return {
            'progress': progress,
            'badges': badges,
            'summary': {
                'level': progress['level'],
                'xp': progress['xp_earned'],
                'total_practice': progress['total_minutes'],
                'best_score': progress['best_score'],
                'current_streak': progress['current_streak'],
                'badges_earned': badges['total_badges'],
            }
        }
