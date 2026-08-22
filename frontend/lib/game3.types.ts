export type InputMode = 'text' | 'mic';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type SessionState = 'lobby' | 'playing' | 'evaluating' | 'score_reveal' | 'life_lost' | 'game_over';

export interface Game3Config {
  timePerRound: number;
  totalLives: number;
  totalRounds: number;
}

export interface ConceptCard {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
}

export interface EvaluationResult {
  clarity: number;
  structure: number;
  depth: number;
  brevity: number;
  totalScore: number;
  feedback: string;
  xpAwarded: number;
  lifeConsumed: boolean;
  livesRemaining: number;
  streak: number;
  transcript?: string;
  weak_filler?: string;
  improve?: string;
  better_line?: string;
  filler_penalty?: number;
  fluency_score?: number;
  structure_score?: number;
  content_score?: number;
}

export interface CardResult extends EvaluationResult {
  card: ConceptCard;
}

export interface FullResults {
  outcome: 'completed' | 'eliminated';
  totalXp: number;
  finalScore: number;
  cardBreakdown: CardResult[];
  agentSummary: {
    clarity: string;
    structure: string;
    depth: string;
    brevity: string;
    overall: string;
  };
}