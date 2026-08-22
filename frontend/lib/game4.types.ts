export type SessionState = 'lobby' | 'playing' | 'revealing' | 'boss_intro' | 'game_over';
export type QuestionType = 'mcq' | 'open';
export type OptionState = 'default' | 'locked' | 'selected' | 'disabled' | 'trap' | 'correct' | 'eliminated';
export type LifelineType = '50_50' | 'hint';

export interface Game4Config {
  totalQuestions: number;
}

export interface UserStats {
  bestGooglyRating: number;
  currentStreak: number;
}

export interface Option {
  id: string;
  text: string;
}

export interface GooglyQuestion {
  id: string;
  type: QuestionType;
  title?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'boss';
  company?: string;
  companies?: string[];
  questionText: string;
  options?: Option[];
  correctOptionId?: string;
  trapOptionId?: string;
  trapExplanation?: string;
  playerInsight?: string;
  hint?: string;
}

export interface RevealResult {
  correctOptionId?: string;
  trapOptionId?: string;
  isCorrect: boolean;
  isTrap: boolean;
  trapExplanation: string;
  playerInsight: string;
  ratingDelta: number;
  newRating: number;
  confidenceBonus?: number;
  totalXpAwarded?: number;
  score?: number;
  idealResponse?: string;
}