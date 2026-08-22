'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Game3Config, SessionState, ConceptCard, InputMode, EvaluationResult, FullResults, CardResult } from '../../lib/game3.types';
import { apiRequest, getBackendBaseUrl } from '@/lib/auth';

interface Game3ContextValue {
  sessionConfig: Game3Config | null;
  sessionId: string | null;
  sessionState: SessionState | null;
  currentCard: ConceptCard | null;
  currentRound: number;
  inputMode: InputMode;
  answer: string;
  audioBlob: Blob | null;
  timeRemaining: number;
  timerActive: boolean;
  evaluationResult: EvaluationResult | null;
  isEvaluating: boolean;
  results: FullResults | null;
  streak: number;
  livesRemaining: number;
  xpAwarded: number | null;
  badgesEarned: Array<{ name: string; icon: string; description: string }>;
  selectedLevel: 'EASY' | 'MEDIUM' | 'HARD' | 'GOD';
  setSelectedLevel: (level: 'EASY' | 'MEDIUM' | 'HARD' | 'GOD') => void;
  warmupDrill: { instruction: string; drill_sentence: string; focus: string } | null;
  setWarmupDrill: (drill: any) => void;
  fetchWarmupDrill: () => Promise<void>;
  
  setInputMode: (mode: InputMode) => void;
  setAnswer: (text: string) => void;
  setAudioBlob: (blob: Blob | null) => void;
  submitAnswer: () => Promise<void>;
  startGame: () => Promise<void>;
  advanceToNextCard: () => void;
  abandonGame: () => Promise<void>;
  setBadgesEarned: (badges: Array<{ name: string; icon: string; description: string }>) => void;
}

const Game3Context = createContext<Game3ContextValue | undefined>(undefined);

export function Game3Provider({ children }: { children: React.ReactNode }) {
  const [sessionConfig, setSessionConfig] = useState<Game3Config | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('lobby');
  const [currentCard, setCurrentCard] = useState<ConceptCard | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [answer, setAnswer] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<FullResults | null>(null);
  const [streak, setStreak] = useState(0);
  const [livesRemaining, setLivesRemaining] = useState(3);
  const [cardHistory, setCardHistory] = useState<CardResult[]>([]);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);
  const [badgesEarned, setBadgesEarned] = useState<Array<{ name: string; icon: string; description: string }>>([]);
  const [selectedLevelState, setSelectedLevelState] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'GOD'>('EASY');
  const [warmupDrill, setWarmupDrill] = useState<{ instruction: string; drill_sentence: string; focus: string } | null>(null);

  // Load level from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem('game3_level') as 'EASY' | 'MEDIUM' | 'HARD' | 'GOD';
      if (savedLevel && ['EASY', 'MEDIUM', 'HARD', 'GOD'].includes(savedLevel)) {
        setSelectedLevelState(savedLevel);
      }
    }
  }, []);

  const selectedLevel = selectedLevelState;

  const setSelectedLevel = (level: 'EASY' | 'MEDIUM' | 'HARD' | 'GOD') => {
    setSelectedLevelState(level);
    if (typeof window !== 'undefined') {
      localStorage.setItem('game3_level', level);
    }
  };

  const getSeenCardIds = (): string[] => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('game3_seen_ids');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  };

  const getSeenTopicTitles = (): string[] => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('game3_seen_topics');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  };

  const markCardAsSeen = (id: string, title: string) => {
    if (typeof window !== 'undefined') {
      const seenIds = getSeenCardIds();
      if (!seenIds.includes(id)) {
        seenIds.push(id);
        localStorage.setItem('game3_seen_ids', JSON.stringify(seenIds));
      }
      const seenTitles = getSeenTopicTitles();
      if (!seenTitles.includes(title)) {
        seenTitles.push(title);
        localStorage.setItem('game3_seen_topics', JSON.stringify(seenTitles));
      }
    }
  };

  const fetchWarmupDrill = async () => {
    let fingerprint = { top_filler: "um", pattern: "speaking pace is good but uses standard filler words." };
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speech_fingerprint');
      if (saved) {
        try {
          fingerprint = JSON.parse(saved);
        } catch (e) {}
      }
    }

    try {
      const baseUrl = getBackendBaseUrl();
      const response = await fetch(`${baseUrl}/api/game3/warmup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          top_filler: fingerprint.top_filler,
          pattern: fingerprint.pattern
        })
      });
      const result = await response.json();
      setWarmupDrill(result);
    } catch (e) {
      console.error("Failed to fetch warmup drill:", e);
    }
  };

  const recordProgress = async (payload: {
    outcome: 'completed' | 'eliminated'
    totalXp: number
    finalScore: number
    history: CardResult[]
  }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) return

    const weakAreas = Array.from(new Set(
      payload.history
        .filter((card) => card.totalScore < 60)
        .map((card) => card.card.category)
    ))

    try {
      const activityResult = await apiRequest<{ xpAwarded: number; badgesEarned: Array<{ name: string; icon: string; description: string }> }>('/api/dashboard/activity', {
        method: 'POST',
        token,
        suppressErrors: true,
        body: {
          gameKey: 'game3',
          title: 'Articulate Master',
          score: payload.finalScore,
          pointsAwarded: payload.totalXp,
          summary: payload.outcome === 'completed'
            ? 'Completed the articulation challenge and received evaluation feedback.'
            : 'Ended the articulation challenge early and recorded improvement areas.',
          focusAreas: weakAreas.length > 0 ? weakAreas : ['clarity', 'structured-answers'],
          gameplayMetadata: {
            filler_slayer_complete: payload.history.every(h => h.clarity >= 24),
            polished_speaker_win: payload.finalScore >= 80
          }
        },
      })
      
      if (activityResult) {
        setXpAwarded(activityResult.xpAwarded);
        if (activityResult.badgesEarned && activityResult.badgesEarned.length > 0) {
          setBadgesEarned(activityResult.badgesEarned);
        }
      }
    } catch (error) {
      console.error('Failed to record game3 progress:', error)
    }
  };

  // Timer Effect
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) return;
    const interval = setInterval(() => setTimeRemaining((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  // Auto-submit on 0
  useEffect(() => {
    if (timeRemaining === 0 && timerActive) {
      setTimerActive(false);
      submitAnswer();
    }
  }, [timeRemaining, timerActive]);

  // Initial Config Fetch
  useEffect(() => {
    setTimeout(() => {
      setSessionConfig({ timePerRound: 90, totalLives: 3, totalRounds: 5 });
    }, 800);
  }, []);

  const startGame = async () => {
    setSessionState('playing');
    setSessionId(`sess_${Math.random().toString(36).substring(2, 11)}`);
    setLivesRemaining(sessionConfig?.totalLives || 3);
    setCurrentRound(1);
    setStreak(0);
    setCardHistory([]);
    fetchNextCard();
  };

  const fetchNextCard = async () => {
    // Get all the IDs we've already played so we don't get repeats
    const sessionSeenIds = cardHistory.map(h => h.card.id);
    const globalSeenIds = getSeenCardIds();
    const excludeIds = Array.from(new Set([...sessionSeenIds, ...globalSeenIds]));

    try {
      const baseUrl = getBackendBaseUrl();
      const response = await fetch(`${baseUrl}/api/game3/next-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          excludeIds,
          level: selectedLevel
        })
      });
      const result = await response.json();

      let targetCard = null;
      if (result.status === 'success') {
        const card = result.data;
        // Check if difficulty matches current selected level (case-insensitive)
        if (card.difficulty.toUpperCase() === selectedLevel.toUpperCase()) {
          targetCard = card;
        }
      }

      if (!targetCard) {
        const genResponse = await fetch(`${baseUrl}/api/game3/generate-topic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: selectedLevel,
            seen_topics: Array.from(new Set([
              ...cardHistory.map(h => h.card.title),
              ...getSeenTopicTitles()
            ]))
          })
        });
        const genResult = await genResponse.json();
        targetCard = {
          id: `gen_${Date.now()}`,
          title: genResult.topic,
          category: "AI Generated Concept",
          difficulty: selectedLevel
        };
      }

      setCurrentCard(targetCard as any);
      markCardAsSeen(targetCard.id, targetCard.title);
      setTimeRemaining(sessionConfig?.timePerRound || 90);
      setTimerActive(true);
      setAnswer('');
      setAudioBlob(null);
      setEvaluationResult(null);
    } catch (error) {
      console.error("Failed to fetch next card:", error);
    }
  };

  const submitAnswer = async () => {
    setTimerActive(false);
    setIsEvaluating(true);
    setSessionState('evaluating');

    if (!answer.trim() && !audioBlob) {
      const newEvaluation: EvaluationResult = {
        clarity: 0, structure: 0, depth: 0, brevity: 0,
        totalScore: 0,
        feedback: "Time expired before an answer was provided.",
        xpAwarded: 0,
        lifeConsumed: true,
        livesRemaining: livesRemaining - 1,
        streak: 0
      };

      setStreak(0);
      setLivesRemaining(newEvaluation.livesRemaining);
      setEvaluationResult(newEvaluation);

      const nextHistory = [...cardHistory, { ...newEvaluation, card: currentCard! }];
      setCardHistory(nextHistory);

      if (newEvaluation.livesRemaining <= 0) {
        generateFinalResults('eliminated', nextHistory);
      } else {
        setSessionState('life_lost');
      }
      setIsEvaluating(false);
      return;
    }

    try {
      let response;

      // 1. ROUTE AUDIO TO THE MULTIPART ENDPOINT
      if (inputMode === 'mic' && audioBlob) {
        const formData = new FormData();
        formData.append('questionId', currentCard!.id);
        // We append '.webm' so Flask and Gemini know exactly how to parse the audio format
        formData.append('audio', audioBlob, 'recording.webm');

        const baseUrl = getBackendBaseUrl();
        response = await fetch(`${baseUrl}/api/game3/evaluate`, {
          method: 'POST',
          body: formData,
          // Note: Do NOT set the 'Content-Type' header here. 
          // The browser automatically sets it with the correct multipart boundary for FormData.
        });
      } 
      // 2. ROUTE TEXT TO THE JSON ENDPOINT
      else {
        const baseUrl = getBackendBaseUrl();
        response = await fetch(`${baseUrl}/api/game3/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: currentCard!.id,
            answer: answer,
          })
        });
      }

      const result = await response.json();

      if (result.status === 'success') {
        const evalData = result.data;
        const lifeLost = evalData.lifeConsumed;
        const isGood = evalData.totalScore >= 70; // 70+ keeps the streak alive

        // Map the backend's multi-agent JSON perfectly to your frontend state
        const newEvaluation: EvaluationResult = {
          clarity: evalData.clarity,
          structure: evalData.structure,
          depth: evalData.depth,
          brevity: evalData.brevity,
          totalScore: evalData.totalScore,
          feedback: evalData.feedback,
          xpAwarded: evalData.xpAwarded,
          lifeConsumed: lifeLost,
          livesRemaining: livesRemaining - (lifeLost ? 1 : 0),
          streak: isGood && !lifeLost ? streak + 1 : 0,
          transcript: evalData.transcript || answer,
          weak_filler: evalData.weak_filler,
          improve: evalData.improve,
          better_line: evalData.better_line,
          filler_penalty: evalData.filler_penalty
        };

        setStreak(newEvaluation.streak);
        setLivesRemaining(newEvaluation.livesRemaining);
        setEvaluationResult(newEvaluation);

        const nextHistory = [...cardHistory, { ...newEvaluation, card: currentCard! }];
        setCardHistory(nextHistory);

        // UI State Machine Transitions
        if (newEvaluation.livesRemaining <= 0) {
          generateFinalResults('eliminated', nextHistory);
        } else if (lifeLost) {
          setSessionState('life_lost');
        } else {
          setSessionState('score_reveal');
        }
      } else {
        console.error("Backend Error:", result.message);
        setSessionState('playing'); // Fail gracefully back to the board
      }

    } catch (error) {
      console.error("Network Error:", error);
      setSessionState('playing'); // Fail gracefully back to the board
    } finally {
      setIsEvaluating(false);
    }
  };

  const advanceToNextCard = () => {
    if (currentRound >= (sessionConfig?.totalRounds || 5)) {
      generateFinalResults('completed');
    } else {
      setCurrentRound(prev => prev + 1);
      setSessionState('playing');
      fetchNextCard();
    }
  };

  const generateFinalResults = (outcome: 'completed' | 'eliminated', historySnapshot: CardResult[] = cardHistory) => {
    const totalXp = historySnapshot.reduce((acc, curr) => acc + curr.xpAwarded, 0)
    const finalScore = Math.round(historySnapshot.reduce((acc, curr) => acc + curr.totalScore, 0) / Math.max(historySnapshot.length, 1))

    const finalResults = {
      outcome,
      totalXp,
      finalScore,
      cardBreakdown: historySnapshot,
      agentSummary: {
        clarity: "You generally speak clearly, but occasionally use filler words.",
        structure: "Good start, but try to use the STAR method when explaining tradeoffs.",
        depth: "Strong technical depth shown.",
        brevity: "You kept answers concise and respected the time limits.",
        overall: "Solid performance. Work on reducing 'ums' to sound more authoritative."
      },
      levelUp: false,
      newLevel: selectedLevel
    }

    // Level progression logic: 3 or 4 passed (score >= 75) at same level -> move to next level
    const currentLevelCards = historySnapshot.filter(h => h.card.difficulty.toUpperCase() === selectedLevel.toUpperCase());
    if (currentLevelCards.length >= 4) {
      const passedCount = currentLevelCards.filter(h => h.totalScore >= 75).length;
      if (passedCount >= 3) {
        let nextLevel: 'EASY' | 'MEDIUM' | 'HARD' | 'GOD' = selectedLevel;
        if (selectedLevel === 'EASY') nextLevel = 'MEDIUM';
        else if (selectedLevel === 'MEDIUM') nextLevel = 'HARD';
        else if (selectedLevel === 'HARD') nextLevel = 'GOD';
        
        if (nextLevel !== selectedLevel) {
          setSelectedLevel(nextLevel);
          finalResults.levelUp = true;
          finalResults.newLevel = nextLevel;
        }
      }
    }

    setResults(finalResults as any);
    void recordProgress({ outcome, totalXp, finalScore, history: historySnapshot });
    updateSpeechFingerprint(historySnapshot);
    setSessionState('game_over');
  };

  const countFillerWords = (text: string): number => {
    if (!text) return 0;
    const words = text.toLowerCase().split(/\s+/);
    const fillers = ['um', 'uh', 'like', 'so', 'actually', 'basically'];
    return words.filter(w => fillers.includes(w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""))).length;
  };

  const updateSpeechFingerprint = (historySnapshot: CardResult[]) => {
    const allTranscripts = historySnapshot.map(h => h.transcript || "");
    const fillerHistory = historySnapshot.map(h => countFillerWords(h.transcript || ""));
    const scoreHistory = historySnapshot.map(h => h.totalScore);
    const weakFiller = historySnapshot[historySnapshot.length - 1]?.weak_filler || "um";

    const baseUrl = getBackendBaseUrl();
    fetch(`${baseUrl}/api/game3/update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        all_transcripts: allTranscripts,
        filler_history: fillerHistory,
        score_history: scoreHistory,
        weak_filler: weakFiller
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data && !data.error) {
        localStorage.setItem('speech_fingerprint', JSON.stringify(data));
      }
    })
    .catch(err => console.error("Error updating profile fingerprint:", err));
  };

  const abandonGame = async () => {
    setSessionState('lobby');
  };

  return (
    <Game3Context.Provider value={{
      sessionConfig, sessionId, sessionState, currentCard, currentRound,
      inputMode, answer, audioBlob, timeRemaining, timerActive,
      evaluationResult, isEvaluating, results, streak, livesRemaining,
      xpAwarded, badgesEarned,
      selectedLevel, setSelectedLevel,
      warmupDrill, setWarmupDrill, fetchWarmupDrill,
      setInputMode, setAnswer, setAudioBlob, submitAnswer, startGame, advanceToNextCard, abandonGame, setBadgesEarned
    }}>
      {children}
    </Game3Context.Provider>
  );
}

export const useGame3 = () => {
  const context = useContext(Game3Context);
  if (!context) throw new Error('useGame3 must be used within Game3Provider');
  return context;
};

