'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SessionState, GooglyQuestion, OptionState, RevealResult, LifelineType } from '../../lib/game4.types';
import { getRandomQuestions, GOOGLY_PUZZLES } from '@/lib/data/puzzles';
import { apiRequest } from '@/lib/auth';

interface Game4ContextValue {
  sessionId: string | null;
  sessionState: SessionState;
  questions: GooglyQuestion[];
  currentQuestion: GooglyQuestion | null;
  currentRound: number;
  totalRounds: number;
  googlyRating: number;
  confidenceBet: 1 | 2 | 3 | null;
  selectedOptionId: string | null;
  openAnswer: string;
  optionStates: Record<string, OptionState>;
  typewriterDone: boolean;
  hintText: string | null;
  usedLifelines: Record<LifelineType, boolean>;
  revealResult: RevealResult | null;
  isSubmitting: boolean;
  timerSeconds: number;
  winsCount: number;
  consecutiveCorrect: number;
  showLevelUpAnimation: boolean;
  isListening: boolean;
  seenQuestionIds: string[];
  pendingLevelUp: boolean;
  setPendingLevelUp: (pending: boolean) => void;
  setConfidenceBet: (bet: 1 | 2 | 3) => void;
  selectOption: (id: string) => void;
  setOpenAnswer: (text: string) => void;
  setTypewriterDone: (done: boolean) => void;
  useLifeline: (type: LifelineType) => void;
  submitAnswer: () => Promise<void>;
  startGame: () => void;
  advanceToNextQuestion: () => void;
  abandonGame: () => void;
  startListening: () => void;
  setShowLevelUpAnimation: (show: boolean) => void;
}

const Game4Context = createContext<Game4ContextValue | undefined>(undefined);

export function Game4Provider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('lobby');
  const [questions, setQuestions] = useState<GooglyQuestion[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [googlyRating, setGooglyRating] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<GooglyQuestion | null>(null);
  const [confidenceBet, setConfidenceBet] = useState<1 | 2 | 3 | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState('');
  const [optionStates, setOptionStates] = useState<Record<string, OptionState>>({});
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [usedLifelines, setUsedLifelines] = useState<Record<LifelineType, boolean>>({ '50_50': false, 'hint': false });
  const [revealResult, setRevealResult] = useState<RevealResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [timerSeconds, setTimerSeconds] = useState(30);
  const [winsCount, setWinsCount] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [seenQuestionIds, setSeenQuestionIds] = useState<string[]>([]);
  const [pendingLevelUp, setPendingLevelUp] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = sessionStorage.getItem('g4_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sessionState !== 'lobby' && parsed.sessionState !== 'game_over') {
          setSessionId(parsed.sessionId);
          setSessionState(parsed.sessionState);
          setQuestions(parsed.questions || []);
          setCurrentRound(parsed.currentRound);
          setTotalRounds(parsed.totalRounds || 3);
          setGooglyRating(parsed.googlyRating || 0);
          setCurrentQuestion(parsed.currentQuestion);
          setUsedLifelines(parsed.usedLifelines || { '50_50': false, 'hint': false });
          setSeenQuestionIds(parsed.seenQuestionIds || []);
        }
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      sessionStorage.setItem('g4_state', JSON.stringify({
        sessionId,
        sessionState,
        questions,
        currentRound,
        totalRounds,
        googlyRating,
        currentQuestion,
        usedLifelines,
        seenQuestionIds
      }));
    }
  }, [sessionId, sessionState, questions, currentRound, totalRounds, googlyRating, currentQuestion, usedLifelines, seenQuestionIds]);

  const loadQuestionForRound = useCallback((round: number, qList: GooglyQuestion[]) => {
    if (round > qList.length) {
      setSessionState('game_over');
      return;
    }

    const nextQuestion = qList[round - 1];
    setCurrentQuestion(nextQuestion);
    setConfidenceBet(null);
    setSelectedOptionId(null);
    setOpenAnswer('');
    setHintText(null);
    setRevealResult(null);
    setTypewriterDone(false);
    setTimerSeconds(30);

    const initialStates: Record<string, OptionState> = {};
    nextQuestion?.options?.forEach(opt => {
      initialStates[opt.id] = 'default';
    });
    setOptionStates(initialStates);
    setSessionState('playing');
  }, []);

  const startGame = useCallback(() => {
    const newSessionId = `g4_${Date.now()}`;
    const newQuestions = getRandomQuestions(3);
    setSessionId(newSessionId);
    setGooglyRating(0);
    setCurrentRound(1);
    setTotalRounds(newQuestions.length);
    setQuestions(newQuestions);
    setUsedLifelines({ '50_50': false, 'hint': false });
    loadQuestionForRound(1, newQuestions);
  }, [loadQuestionForRound]);

  const selectOption = (id: string) => {
    if (sessionState !== 'playing' || !typewriterDone || optionStates[id] === 'eliminated') return;

    setSelectedOptionId(id);
    setOptionStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (next[k] !== 'eliminated') next[k] = k === id ? 'selected' : 'default';
      });
      return next;
    });
  };

  const useLifeline = (type: LifelineType) => {
    if (usedLifelines[type] || !currentQuestion) return;
    setUsedLifelines(prev => ({ ...prev, [type]: true }));

    if (type === '50_50' && currentQuestion.options) {
      const correctId = currentQuestion.correctOptionId;
      const trapId = currentQuestion.trapOptionId;

      const candidates = currentQuestion.options.filter(o => o.id !== correctId && o.id !== trapId);
      const toEliminate = candidates.length >= 2 
        ? candidates.slice(0, 2)
        : currentQuestion.options.filter(o => o.id !== correctId).slice(0, 2);

      setOptionStates(prev => {
        const next = { ...prev };
        toEliminate.forEach(opt => {
          next[opt.id] = 'eliminated';
        });
        return next;
      });
    } else if (type === 'hint') {
      setHintText(currentQuestion.hint || "Think carefully about boundary conditions and subtle trap assumptions.");
    }
  };

  const recordProgress = async (payload: { pointsAwarded: number; summary: string; score: number; focusAreas: string[] }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) return;

    try {
      await apiRequest('/api/dashboard/activity', {
        method: 'POST',
        token,
        suppressErrors: true,
        body: {
          gameKey: 'game4',
          title: 'GOOGLY MASTER',
          score: payload.score,
          pointsAwarded: payload.pointsAwarded,
          summary: payload.summary,
          focusAreas: payload.focusAreas,
          gameplayMetadata: {
            googly_guru_win: payload.score >= 80,
            three_in_a_row: consecutiveCorrect >= 3
          }
        },
      });
    } catch (error) {
      console.error('Failed to record game4 progress:', error);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !selectedOptionId) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/game4/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedOptionId,
          confidenceBet: confidenceBet || 1,
          currentRating: googlyRating,
          totalQuestions: totalRounds
        })
      });

      let data: RevealResult;
      if (res.ok) {
        data = await res.json();
      } else {
        const isCorrect = selectedOptionId === currentQuestion.correctOptionId;
        const isTrap = selectedOptionId === currentQuestion.trapOptionId;
        const multiplier = confidenceBet || 1;
        
        const basePerQ = 100 / Math.max(totalRounds, 1);
        let delta = 0;
        let confidenceBonus = 0;

        if (isCorrect) {
          confidenceBonus = multiplier === 3 ? 10 : (multiplier === 2 ? 5 : 0);
          delta = Math.round(basePerQ + confidenceBonus);
        } else if (isTrap) {
          const trapPenalty = multiplier === 3 ? 20 : (multiplier === 2 ? 12 : 6);
          delta = -trapPenalty;
        } else {
          const wrongPenalty = multiplier === 3 ? 10 : (multiplier === 2 ? 6 : 3);
          delta = -wrongPenalty;
        }

        const newRating = Math.max(0, Math.min(100, googlyRating + delta));

        data = {
          correctOptionId: currentQuestion.correctOptionId,
          trapOptionId: currentQuestion.trapOptionId,
          isCorrect,
          isTrap,
          trapExplanation: isTrap
            ? currentQuestion.trapExplanation || "You fell for the Googly! That was the intuitive trap."
            : (isCorrect ? "Masterfully solved! You avoided the deceptive trap." : "Incorrect. Review the deduction steps."),
          playerInsight: currentQuestion.playerInsight || "Apply first principles to interview puzzles.",
          ratingDelta: delta,
          newRating,
          confidenceBonus,
          totalXpAwarded: (isCorrect ? 100 * multiplier : 15) + (confidenceBonus * 5)
        };
      }

      setRevealResult(data);
      setGooglyRating(data.newRating);

      if (data.isCorrect) {
        setConsecutiveCorrect(prev => prev + 1);
      } else {
        setConsecutiveCorrect(0);
      }

      if (currentQuestion.type === 'mcq' && currentQuestion.options) {
        setOptionStates(prev => {
          const resMap = { ...prev };
          if (data.correctOptionId) {
            resMap[data.correctOptionId] = 'correct';
          }
          if (data.isTrap && selectedOptionId) {
            resMap[selectedOptionId] = 'trap';
          }
          return resMap;
        });
      }

      setSessionState('revealing');

      if (currentRound >= totalRounds) {
        recordProgress({
          score: data.newRating,
          pointsAwarded: (data.totalXpAwarded || 50),
          summary: `Completed Googly Master session with a rating of ${data.newRating}/100.`,
          focusAreas: [currentQuestion.category]
        });
      }
    } catch (e) {
      console.error('Submission error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const advanceToNextQuestion = () => {
    if (currentRound >= totalRounds) {
      setSessionState('game_over');
      sessionStorage.removeItem('g4_state');
    } else {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      loadQuestionForRound(nextRound, questions);
    }
  };

  const abandonGame = () => {
    sessionStorage.removeItem('g4_state');
  };

  const startListening = () => {};

  return (
    <Game4Context.Provider value={{
      sessionId, sessionState, questions, currentQuestion, currentRound, totalRounds, googlyRating,
      confidenceBet, selectedOptionId, openAnswer, optionStates, typewriterDone,
      hintText, usedLifelines, revealResult, isSubmitting, timerSeconds, winsCount, consecutiveCorrect,
      showLevelUpAnimation, isListening, seenQuestionIds, pendingLevelUp, setPendingLevelUp,
      setConfidenceBet, selectOption, setOpenAnswer, setTypewriterDone,
      useLifeline, submitAnswer, startGame, advanceToNextQuestion, abandonGame, startListening,
      setShowLevelUpAnimation
    }}>
      {children}
    </Game4Context.Provider>
  );
}

export const useGame4 = () => {
  const context = useContext(Game4Context);
  if (!context) throw new Error('useGame4 must be used within Game4Provider');
  return context;
};