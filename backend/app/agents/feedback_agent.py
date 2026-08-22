"""
Agent 7: Feedback & Rewrite Agent
Generates actionable feedback and rewrites answers
"""

from typing import Dict, List
from app.agents.answer_analyzer import AnswerAnalyzer

class FeedbackAgent:
    """Generates concrete feedback and improved answer rewrites"""
    
    # Rewrite templates for common issues
    REWRITE_TEMPLATES = {
        'missing_action': "Try adding what you specifically did: 'I immediately took the following steps...'",
        'missing_result': "End with a concrete result: 'This resulted in a 20% improvement' or 'We successfully launched on time'",
        'too_vague': "Replace vague words with specific metrics or actions. Instead of 'quickly', say 'within 2 hours'",
        'no_structure': "Use a structure: Situation → Action → Result. Start with 'Here's what happened...' then 'I did...' then 'The outcome was...'",
        'too_many_fillers': "Pause instead of using fillers. Replace 'um, like, basically' with silence or 'let me think'",
        'fast_pace': "Slow down. Pause between sentences. This gives time for impact and looks more thoughtful.",
        'slow_pace': "Speak with more energy and urgency. This shows enthusiasm and confidence.",
    }
    
    @staticmethod
    def identify_issues(analysis: Dict) -> List[Dict]:
        """Identify specific issues in the answer"""
        issues = []
        
        # Filler issues
        if analysis['fillers']['count'] > 3:
            issues.append({
                'category': 'fillers',
                'severity': 'high' if analysis['fillers']['count'] > 5 else 'medium',
                'issue': f"You used {analysis['fillers']['count']} filler words",
                'examples': [f['word'] for f in analysis['fillers']['instances'][:3]],
                'tip': "Replace fillers with pauses. Practice comfortable silence.",
                'priority': 1
            })
        
        # Stutter issues
        if analysis['stutters']['count'] > 0:
            issues.append({
                'category': 'stutters',
                'severity': 'medium',
                'issue': f"You repeated words {analysis['stutters']['count']} times",
                'examples': [f['word'] for f in analysis['stutters']['instances']],
                'tip': "Take a breath between thoughts. Slow down your speech.",
                'priority': 2
            })
        
        # Pace issues
        pace = analysis['pace']['classification']
        if pace == 'very_fast':
            issues.append({
                'category': 'pace',
                'severity': 'high',
                'issue': f"You're speaking too fast ({analysis['pace']['words_per_minute']} wpm)",
                'tip': "Slow down to 120-150 wpm. Pause between ideas.",
                'priority': 2
            })
        elif pace == 'slow':
            issues.append({
                'category': 'pace',
                'severity': 'medium',
                'issue': f"You're speaking too slowly ({analysis['pace']['words_per_minute']} wpm)",
                'tip': "Increase pace to 120-150 wpm to show confidence.",
                'priority': 3
            })
        
        # Structure issues
        if analysis['relevance']['star_structure_score'] < 60:
            issues.append({
                'category': 'structure',
                'severity': 'high',
                'issue': "Your answer lacks clear structure (Situation-Action-Result)",
                'tip': "Structure your answer: 1) What was the situation? 2) What did YOU do? 3) What was the result?",
                'priority': 1
            })
        
        # Specificity issues
        if analysis['relevance']['specificity_score'] < 50:
            issues.append({
                'category': 'specificity',
                'severity': 'high',
                'issue': "Your answer is too vague. Add numbers, names, and metrics.",
                'tip': "Instead of 'we improved it', say 'we reduced latency by 40%' or 'response time improved from 5s to 2s'",
                'priority': 1
            })
        
        # Length issues
        if analysis['relevance']['word_count'] < 30:
            issues.append({
                'category': 'length',
                'severity': 'medium',
                'issue': f"Your answer is too short ({analysis['relevance']['word_count']} words)",
                'tip': "Provide more detail. Aim for 60-100 words. Explain your thinking.",
                'priority': 2
            })
        
        # Sort by priority
        issues.sort(key=lambda x: x['priority'])
        return issues[:3]  # Return top 3 issues
    
    @staticmethod
    def generate_tips(analysis: Dict) -> List[str]:
        """Generate top 3 actionable tips"""
        issues = FeedbackAgent.identify_issues(analysis)
        
        tips = []
        for issue in issues[:3]:
            tips.append(f"• {issue['issue']} — {issue['tip']}")
        
        return tips
    
    @staticmethod
    def rewrite_answer_with_tips(original_answer: str, analysis: Dict) -> Dict:
        """Generate a rewritten version with tips embedded"""
        
        issues = FeedbackAgent.identify_issues(analysis)
        
        # Start with a clean, structured version
        rewritten = f"""Here's a rewritten version addressing the key issues:

{original_answer}

Improvements made:
"""
        
        for issue in issues:
            rewritten += f"\n• Fixed: {issue['issue']}"
            if issue.get('examples'):
                rewritten += f" (e.g., '{', '.join(issue['examples'])}')"
        
        return {
            'original': original_answer,
            'issues_found': len(issues),
            'top_issues': issues,
            'tips': FeedbackAgent.generate_tips(analysis),
            'rewrite_guidance': rewritten
        }
    
    @staticmethod
    def generate_complete_feedback(answer: str, analysis: Dict, question: str) -> Dict:
        """Generate comprehensive feedback package"""
        
        issues = FeedbackAgent.identify_issues(analysis)
        tips = FeedbackAgent.generate_tips(analysis)
        
        # Determine what went well
        strengths = []
        if analysis['relevance']['relevance_score'] > 70:
            strengths.append("✓ You addressed the question well")
        if analysis['fillers']['count'] <= 1:
            strengths.append("✓ Minimal filler words")
        if analysis['stutters']['count'] == 0:
            strengths.append("✓ No stuttering detected")
        if analysis['pace']['classification'] == 'normal':
            strengths.append("✓ Good speaking pace")
        if analysis['relevance']['word_count'] > 60:
            strengths.append("✓ Detailed explanation")
        
        return {
            'overall_assessment': f"Your response was {['weak', 'needs work', 'okay', 'good', 'excellent'][min(int(analysis['fluency_score']/20), 4)]}.",
            'strengths': strengths if strengths else ["Continue practicing to build confidence"],
            'issues': issues,
            'top_3_tips': tips,
            'metrics': {
                'fillers': analysis['fillers']['count'],
                'stutters': analysis['stutters']['count'],
                'pace': analysis['pace']['classification'],
                'words_per_minute': analysis['pace']['words_per_minute'],
                'relevance_score': analysis['relevance']['relevance_score'],
            },
            'action_items': [
                issue['tip'] for issue in issues
            ]
        }
