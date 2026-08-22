"""
Agent 6: Scoring Agent
Combines all signals (content, fluency, fillers, etc.) into final score
"""

from typing import Dict

class ScoringAgent:
    """Calculates comprehensive interview score based on multiple factors"""
    
    @staticmethod
    def calculate_score(analysis: Dict) -> Dict:
        """
        Calculate final score using weighted formula:
        - Content & Relevance: 40%
        - Fluency & Rhythm: 25%
        - Filler Penalty: 25%
        - Time & Specificity: 10%
        
        Returns score breakdown and total
        """
        
        # Extract scores from analysis
        relevance_score = analysis['relevance']['relevance_score']
        fluency_score = analysis['fluency_score']
        specificity_score = analysis['relevance']['specificity_score']
        
        # Calculate filler penalty (inverse - fewer fillers = higher score)
        filler_count = analysis['fillers']['count']
        filler_score = max(0, 100 - (filler_count * 10))  # -10 per filler
        
        # Stutter/repetition penalty
        stutter_count = analysis['stutters']['count']
        repetition_count = analysis['repetitions']['count']
        disfluency_score = max(0, 100 - (stutter_count * 15) - (repetition_count * 8))
        
        # Delivery score (fluency + disfluency)
        delivery_score = (fluency_score + disfluency_score) / 2
        
        # Pace score (normal is best)
        pace_classification = analysis['pace']['classification']
        pace_score = {
            'normal': 100,
            'fast': 80,
            'slow': 80,
            'very_fast': 50,
        }.get(pace_classification, 80)
        
        # Content score (relevance + specificity)
        content_score = (relevance_score + specificity_score) / 2
        
        # Calculate weighted total
        total_score = (
            content_score * 0.40 +  # Content & Relevance: 40%
            delivery_score * 0.25 +  # Fluency & Rhythm: 25%
            filler_score * 0.25 +    # Filler Penalty: 25%
            pace_score * 0.10        # Time & Specificity: 10%
        )
        
        # Round to nearest integer
        total_score = round(total_score)
        
        return {
            'total': total_score,
            'breakdown': {
                'content': round(content_score),
                'delivery': round(delivery_score),
                'fluency_and_rhythm': round(fluency_score),
                'fillers': round(filler_score),
                'stutters_and_repetitions': round(disfluency_score),
                'pace': round(pace_score),
                'specificity': round(specificity_score),
            },
            'ratings': {
                'filler_count': filler_count,
                'stutter_count': stutter_count,
                'repetition_count': repetition_count,
                'pace_classification': pace_classification,
                'relevance_coverage': analysis['relevance']['keyword_coverage'],
            },
            'feedback_areas': {
                'fillers_issue': filler_count > 3,
                'pace_issue': pace_classification in ['very_fast', 'slow'],
                'structure_issue': analysis['relevance']['star_structure_score'] < 60,
                'specificity_issue': specificity_score < 50,
                'length_issue': analysis['relevance']['word_count'] < 30,
            }
        }
    
    @staticmethod
    def get_score_label(score: int) -> str:
        """Get performance label based on score"""
        if score >= 90:
            return "Excellent"
        elif score >= 75:
            return "Good"
        elif score >= 60:
            return "Average"
        elif score >= 45:
            return "Needs Improvement"
        else:
            return "Poor"
    
    @staticmethod
    def get_score_color(score: int) -> str:
        """Get color for score visualization"""
        if score >= 90:
            return "green"
        elif score >= 75:
            return "blue"
        elif score >= 60:
            return "yellow"
        elif score >= 45:
            return "orange"
        else:
            return "red"
