"""
Agent 4: Filler & Stutter Detection + Agent 5: Content Relevance
Analyzes answer text for speech patterns and content quality
"""

import re
from typing import Dict, List

class AnswerAnalyzer:
    """Analyzes answer text for disfluency, fillers, stutters, and content relevance"""
    
    # Filler words to detect
    FILLERS = [
        'um', 'uh', 'err', 'erm', 'like', 'you know', 'basically', 'actually', 'literally',
        'so', 'well', 'anyway', 'right', 'kind of', 'sort of', 'i mean', 'basically'
    ]
    
    # Stutter patterns - repeated words
    STUTTER_PATTERN = r'\b(\w+)\s+\1\b'
    
    @staticmethod
    def detect_fillers(text: str) -> Dict:
        """Detect filler words in text"""
        text_lower = text.lower()
        words = text_lower.split()
        
        filler_instances = []
        filler_count = 0
        
        for i, word in enumerate(words):
            clean_word = word.strip('.,!?;:')
            for filler in AnswerAnalyzer.FILLERS:
                if clean_word == filler or filler in clean_word:
                    filler_count += 1
                    filler_instances.append({
                        'word': clean_word,
                        'position': i,
                        'filler': filler
                    })
                    break
        
        return {
            'count': filler_count,
            'instances': filler_instances,
            'density': filler_count / max(len(words), 1)  # Fillers per word
        }
    
    @staticmethod
    def detect_stutters(text: str) -> Dict:
        """Detect stutters (repeated words)"""
        matches = re.finditer(AnswerAnalyzer.STUTTER_PATTERN, text, re.IGNORECASE)
        stutters = []
        
        for match in matches:
            stutters.append({
                'word': match.group(1),
                'position': match.start()
            })
        
        return {
            'count': len(stutters),
            'instances': stutters
        }
    
    @staticmethod
    def detect_repetitions(text: str) -> Dict:
        """Detect word/phrase repetitions beyond stutters"""
        words = text.lower().split()
        word_freq = {}
        
        for word in words:
            clean = word.strip('.,!?;:')
            if len(clean) > 3:  # Ignore short words
                word_freq[clean] = word_freq.get(clean, 0) + 1
        
        # Words that appear more than 3 times are suspicious
        repetitions = {w: c for w, c in word_freq.items() if c > 3}
        
        return {
            'count': len(repetitions),
            'words': repetitions
        }
    
    @staticmethod
    def calculate_pace(text: str, duration_seconds: int) -> Dict:
        """Calculate speaking pace"""
        words = len(text.split())
        
        # Handle edge case
        if duration_seconds <= 0:
            duration_seconds = max(len(text.split()) // 2, 1)  # Rough estimate
        
        wpm = (words / duration_seconds) * 60
        
        # Classification
        if wpm < 100:
            pace = "slow"
        elif wpm < 150:
            pace = "normal"
        elif wpm < 200:
            pace = "fast"
        else:
            pace = "very_fast"
        
        return {
            'words_per_minute': round(wpm, 1),
            'classification': pace,
            'total_words': words,
            'duration_seconds': duration_seconds
        }
    
    @staticmethod
    def analyze_content_relevance(answer: str, question: str) -> Dict:
        """Analyze if answer addresses the question"""
        
        answer_lower = answer.lower()
        question_lower = question.lower()
        
        # Extract key concepts from question
        question_keywords = set(
            word.strip('.,!?;:') for word in question_lower.split() 
            if len(word) > 4
        )
        
        # Check how many keywords are in answer
        answer_words = set(word.strip('.,!?;:') for word in answer_lower.split())
        keyword_matches = len(question_keywords & answer_words)
        keyword_coverage = keyword_matches / max(len(question_keywords), 1)
        
        # Check for STAR structure (Situation, Task, Action, Result)
        has_situation = any(w in answer_lower for w in ['situation', 'happened', 'faced', 'was'])
        has_action = any(w in answer_lower for w in ['did', 'took', 'approached', 'decided', 'implemented'])
        has_result = any(w in answer_lower for w in ['result', 'outcome', 'learned', 'improved', 'succeeded'])
        
        star_score = (has_situation + has_action + has_result) / 3 * 100
        
        # Check answer length (should be reasonably detailed)
        word_count = len(answer.split())
        length_score = min(100, (word_count / 50) * 100)  # 50+ words is good
        
        # Calculate specificity (numbers, metrics, names indicate specificity)
        has_numbers = bool(re.search(r'\d+', answer))
        has_metrics = any(w in answer_lower for w in ['percent', '%', 'improved', 'increased', 'decreased'])
        has_names = bool(re.search(r'[A-Z][a-z]+', answer))
        
        specificity_score = (has_numbers + has_metrics + has_names) / 3 * 100
        
        # Overall relevance score
        relevance_score = (keyword_coverage * 40 + star_score * 35 + specificity_score * 25)
        
        return {
            'relevance_score': round(relevance_score, 1),
            'keyword_coverage': round(keyword_coverage * 100, 1),
            'star_structure_score': round(star_score, 1),
            'specificity_score': round(specificity_score, 1),
            'length_score': round(length_score, 1),
            'word_count': word_count,
            'has_star_elements': {
                'situation': has_situation,
                'action': has_action,
                'result': has_result
            },
            'issues': {
                'vague': relevance_score < 50,
                'too_short': word_count < 30,
                'lacks_structure': star_score < 50,
                'not_specific': specificity_score < 40
            }
        }
    
    @staticmethod
    def analyze_full(answer: str, question: str, duration_seconds: int) -> Dict:
        """Complete analysis of answer"""
        
        fillers = AnswerAnalyzer.detect_fillers(answer)
        stutters = AnswerAnalyzer.detect_stutters(answer)
        repetitions = AnswerAnalyzer.detect_repetitions(answer)
        pace = AnswerAnalyzer.calculate_pace(answer, duration_seconds)
        relevance = AnswerAnalyzer.analyze_content_relevance(answer, question)
        
        # Calculate fluency score (lower is better)
        # Penalize for fillers, stutters, and irregular pace
        base_fluency = 100
        base_fluency -= min(fillers['count'] * 5, 30)  # Fillers: up to -30
        base_fluency -= stutters['count'] * 10  # Stutters: -10 each
        base_fluency -= repetitions['count'] * 5  # Repetitions: -5 each
        
        # Pace penalty
        if pace['classification'] in ['very_fast', 'slow']:
            base_fluency -= 10
        
        fluency_score = max(0, base_fluency)
        
        return {
            'fillers': fillers,
            'stutters': stutters,
            'repetitions': repetitions,
            'pace': pace,
            'relevance': relevance,
            'fluency_score': round(fluency_score, 1),
            'summary': {
                'total_issues': fillers['count'] + stutters['count'] + repetitions['count'],
                'primary_issues': [
                    x for x in [
                        f"{fillers['count']} fillers" if fillers['count'] > 0 else "",
                        f"{stutters['count']} stutters" if stutters['count'] > 0 else "",
                        f"Pace: {pace['classification']}" if pace['classification'] not in ['normal'] else "",
                    ] if x
                ]
            }
        }
