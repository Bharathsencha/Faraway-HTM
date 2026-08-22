'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGame3 } from '../../../components/game3/Game3Context';
import { ConceptCard } from '../../../components/game3/ConceptCard';
import { CountdownRing } from '../../../components/game3/CountdownRing';
import { ScoreMeter } from '../../../components/game3/ScoreMeter';
import { Button } from '../../../components/ui/button';
import BadgeEarnedOverlay from '@/components/BadgeEarnedOverlay';
import { getBackendBaseUrl } from '@/lib/auth';

export default function SessionPage() {
  const router = useRouter();
  const { 
    sessionConfig, sessionState, currentCard, currentRound, 
    timeRemaining, timerActive, inputMode, setInputMode, 
    answer, setAnswer, submitAnswer, evaluationResult, 
    advanceToNextCard, isEvaluating, livesRemaining, abandonGame, startGame,
    xpAwarded, badgesEarned, results, setBadgesEarned,
    selectedLevel, setSelectedLevel, warmupDrill, setWarmupDrill, fetchWarmupDrill,
    audioBlob, setAudioBlob
  } = useGame3();

  const [coachQuestion, setCoachQuestion] = useState('');
  const [coachAnswer, setCoachAnswer] = useState('');
  const [isCoachLoading, setIsCoachLoading] = useState(false);

  const handleAskCoach = async () => {
    if (!coachQuestion.trim() || !evaluationResult || !currentCard) return;
    setIsCoachLoading(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const response = await fetch(`${baseUrl}/api/game3/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: currentCard.title,
          transcript: evaluationResult.transcript || answer,
          score: evaluationResult.totalScore,
          question: coachQuestion.trim()
        })
      });
      const result = await response.json();
      setCoachAnswer(result.answer);
    } catch (e) {
      console.error("Failed to ask coach:", e);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const [dismissedLevelUp, setDismissedLevelUp] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    setLiveTranscript('');
    setCoachQuestion('');
    setCoachAnswer('');
  }, [currentCard]);

  useEffect(() => {
    if (sessionState === 'playing') {
      setDismissedLevelUp(false);
    }
  }, [sessionState]);

  // --- SOUND ENGINE ---
  const playSound = (type: 'click' | 'success' | 'fail' | 'fahhh') => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.play().catch((e) => console.log('Audio autoplay blocked or missing file', e));
    } catch (err) {
      // Ignore server-side execution errors
    }
  };

  // State-driven Sounds (Success, Fail, Game Over)
  useEffect(() => {
    if (sessionState === 'score_reveal' && evaluationResult) {
      playSound('success');
    } else if (sessionState === 'life_lost') {
      playSound('fail');
    } else if (sessionState === 'game_over' && livesRemaining <= 0) {
      playSound('fahhh');
    }
  }, [sessionState, evaluationResult, livesRemaining]);

  // Render Lobby screen before currentCard loads
  if (sessionState === 'lobby') {
    return (
      <div className="min-h-screen bg-muted flex flex-col pt-8 px-4 pb-20 justify-center items-center">
        <div className="max-w-2xl w-full bg-background border border-border rounded-[2rem] p-8 shadow-xl space-y-8 animate-slide-up">
          <div className="text-center space-y-2">
            <span className="text-5xl block animate-pulse">🎙️</span>
            <h1 className="text-4xl font-black text-foreground uppercase tracking-wider">Articulate Master</h1>
            <p className="text-muted-foreground text-sm">
              Practice delivering precise, structured, and filler-free technical explanations.
            </p>
          </div>

          {/* Difficulty Level Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Select Challenge Tier</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['EASY', 'MEDIUM', 'HARD', 'GOD'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => { playSound('click'); setSelectedLevel(tier); }}
                  className={`py-4 rounded-xl border-2 font-bold text-sm transition-all hover:scale-105 ${
                    selectedLevel === tier
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic text-center">
              {selectedLevel === 'EASY' && 'Basic developer building blocks: Git, APIs, Docker, Databases'}
              {selectedLevel === 'MEDIUM' && 'Intermediate microservices & integrations: JWT, Caching, Message Queues'}
              {selectedLevel === 'HARD' && 'Advanced distributed logic: System Design, CAP Theorem, Consistencies'}
              {selectedLevel === 'GOD' && 'Expert architectural scaling: Fault Tolerance, Multi-region scale, Real-time sync'}
            </p>
          </div>

          {/* Warmup Coach Segment */}
          <div className="bg-muted p-5 rounded-2xl border border-border space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-foreground text-sm uppercase">Warmup Speech Coach</h4>
                <p className="text-xs text-muted-foreground">Generate a speech drill tailored to your worst filler habits.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { playSound('click'); fetchWarmupDrill(); }}
                className="font-bold border-primary text-primary hover:bg-primary/5"
              >
                {!warmupDrill ? '✨ Get Drill' : '🔄 Regenerate'}
              </Button>
            </div>

            {warmupDrill && (
              <div className="p-4 bg-background border border-border rounded-xl space-y-3 animate-fade-in">
                <div>
                  <span className="text-[10px] uppercase font-black text-primary block">Instruction</span>
                  <p className="text-xs text-foreground font-medium">{warmupDrill.instruction}</p>
                </div>
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="text-[10px] uppercase font-black text-primary block mb-1">Sentence to repeat 3 times</span>
                  <p className="text-sm font-bold text-foreground italic">"{warmupDrill.drill_sentence}"</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-green-500 block">Focus point</span>
                  <p className="text-xs text-muted-foreground">{warmupDrill.focus}</p>
                </div>
              </div>
            )}
          </div>

          {/* CTA Action */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              className="w-1/3 h-12 rounded-[0.9rem]"
              onClick={() => router.push('/dashboard')}
            >
              Dashboard
            </Button>
            <Button
              size="lg"
              className="w-2/3 h-12 rounded-[0.9rem] font-bold text-base shadow-lg shadow-primary/30"
              onClick={() => { playSound('click'); startGame(); }}
            >
              Start Challenge
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionConfig || !currentCard) return null;

  const handleMicToggle = async () => {
    playSound('click');
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setAudioBlob(blob);

          setIsTranscribing(true);
          setLiveTranscript('');
          try {
            const formData = new FormData();
            formData.append('audio', blob, 'recording.webm');

            const baseUrl = getBackendBaseUrl();
            const res = await fetch(`${baseUrl}/api/game3/transcribe`, {
              method: 'POST',
              body: formData,
            });
            const data = await res.json();
            if (data.status === 'success') {
              setLiveTranscript(data.transcript);
              setAnswer(data.transcript);
            } else {
              setLiveTranscript("Error: Unable to transcribe audio.");
            }
          } catch (err) {
            console.warn("Transcription failed:", err);
            setLiveTranscript("Error: Connection failure during transcription.");
          } finally {
            setIsTranscribing(false);
          }
        };

        mediaRecorder.start();

        // Live Web Speech Transcript (browser-side, while recording)
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript;
            }
            setLiveTranscript(currentTranscript);
          };

          recognitionRef.current = recognition;
          recognition.start();
        } else {
          console.warn("Live transcript not supported in this browser, but audio is still recording.");
        }

        setIsRecording(true);
      } catch (err) {
        console.error("Mic access denied");
        setInputMode('text');
      }
    }
  };

  const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "var(--primary)" : "none"} stroke="var(--primary)" strokeWidth="2" className={filled ? '' : 'opacity-30'}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-muted flex flex-col pt-8 px-4 pb-20">

      {/* HUD Header */}
      <header className="max-w-3xl w-full mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-1">
          {Array.from({ length: sessionConfig.totalLives }).map((_, i) => (
            <HeartIcon key={i} filled={i < livesRemaining} />
          ))}
        </div>
        <div className="text-muted-foreground font-semibold uppercase tracking-widest text-sm">
          Round {currentRound} / {sessionConfig.totalRounds}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            playSound('click');
            abandonGame();
            router.push('/dashboard');
          }}
        >
          Quit
        </Button>
      </header>

      {/* Main Game Area */}
      <main className="max-w-3xl w-full mx-auto flex-1 flex flex-col">

        <div className="flex flex-col items-center justify-center mb-8">
          <div className="mb-8">
            <CountdownRing timeRemaining={timeRemaining} totalTime={sessionConfig.timePerRound} />
          </div>
          <div className="w-full">
            <ConceptCard card={currentCard} />
          </div>
        </div>

        {sessionState === 'playing' && (
          <div className="mt-auto animate-fade-in">
            <div className="flex justify-center mb-4 gap-2">
              <Button
                variant={inputMode === 'mic' ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => { playSound('click'); setInputMode('mic'); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                Speak Answer
              </Button>
              <Button
                variant={inputMode === 'text' ? 'default' : 'outline'}
                className="rounded-full"
                onClick={() => { playSound('click'); setInputMode('text'); }}
              >
                Type Answer
              </Button>
            </div>

            {inputMode === 'text' ? (
              <div className="relative">
                <textarea
                  className="w-full bg-background border border-border rounded-[1rem] p-4 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-32"
                  placeholder="Start explaining your concept..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={!timerActive}
                />
                <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
                  {answer.length} chars
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-8 bg-background border border-border rounded-[1rem] h-32">
                  <button
                    onClick={handleMicToggle}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-primary-foreground shadow-lg transition-transform ${isRecording ? 'bg-destructive animate-pulse scale-110' : 'bg-primary hover:scale-105'}`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/></svg>
                  </button>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {isRecording ? "Recording... Click to stop" : "Click to start speaking"}
                  </p>
                </div>

                {/* Real-time speech transcriber box */}
                {(liveTranscript || isRecording || isTranscribing) && (
                  <div className="p-4 bg-background border border-border rounded-[1rem] space-y-2 animate-fade-in shadow-inner text-left">
                    <div className="flex justify-between items-center border-b border-border pb-1">
                      <span className="text-[10px] uppercase font-black text-primary flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : (isTranscribing ? 'bg-yellow-500 animate-pulse' : 'bg-muted-foreground')}`} />
                        Gemini Transcriber
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Powered by Gemini 2.5 Flash</span>
                    </div>
                    {isTranscribing ? (
                      <div className="flex items-center gap-2 py-1 text-muted-foreground text-sm italic">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        Transcribing your speech using Gemini 2.5 Flash...
                      </div>
                    ) : (
                      <p className={`text-sm leading-relaxed ${liveTranscript ? 'text-foreground font-medium' : 'text-muted-foreground italic'}`}>
                        {liveTranscript || "Speak, then click stop. Gemini will transcribe your answer here..."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button
              size="lg"
              className="w-full mt-4 h-12 rounded-[0.9rem] font-bold text-base"
              onClick={() => { playSound('click'); submitAnswer(); }}
              disabled={isRecording || (!answer && !audioBlob) || isEvaluating}
            >
              {isEvaluating ? 'Evaluating...' : (isRecording ? 'Stop Recording to Submit' : 'Submit Answer')}
            </Button>
          </div>
        )}

        {sessionState === 'score_reveal' && evaluationResult && (
          <div className="bg-background border border-border rounded-[1.25rem] p-6 mt-6 animate-slide-up shadow-sm space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-foreground">AI Evaluation</h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                +{evaluationResult.xpAwarded} XP
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-xl border border-border text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Fluency / Clarity</span>
                <p className="text-2xl font-black text-foreground">{evaluationResult.fluency_score ?? evaluationResult.clarity}/25</p>
              </div>
              <div className="bg-muted p-4 rounded-xl border border-border text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Structure</span>
                <p className="text-2xl font-black text-foreground">{evaluationResult.structure_score ?? evaluationResult.structure}/25</p>
              </div>
              <div className="bg-muted p-4 rounded-xl border border-border text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Content Depth</span>
                <p className="text-2xl font-black text-foreground">{evaluationResult.content_score ?? evaluationResult.depth}/25</p>
              </div>
            </div>

            {evaluationResult.filler_penalty !== undefined && evaluationResult.filler_penalty < 0 && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-semibold flex items-center justify-between">
                <span>⚠️ Filler Word Penalty Applied:</span>
                <span className="font-extrabold">{evaluationResult.filler_penalty} pts (Worst: "{evaluationResult.weak_filler || 'N/A'}")</span>
              </div>
            )}

            <div className="space-y-4 text-sm">
              <div className="p-4 bg-muted rounded-[1rem] border border-border">
                <span className="font-bold block mb-1 text-xs uppercase text-muted-foreground">What you did well</span>
                <p className="text-foreground leading-relaxed">"{evaluationResult.feedback}"</p>
              </div>

              {evaluationResult.improve && (
                <div className="p-4 bg-orange-500/5 rounded-[1rem] border border-orange-500/20">
                  <span className="font-bold block mb-1 text-xs uppercase text-orange-500">How to improve next time</span>
                  <p className="text-foreground leading-relaxed">"{evaluationResult.improve}"</p>
                </div>
              )}

              {evaluationResult.better_line && (
                <div className="p-4 bg-green-500/5 rounded-[1rem] border border-green-500/20">
                  <span className="font-bold block mb-1 text-xs uppercase text-green-500">Rephrased for Impact</span>
                  <p className="text-foreground italic leading-relaxed">"{evaluationResult.better_line}"</p>
                </div>
              )}
            </div>

            {/* Ask the AI Coach Section */}
            <div className="bg-muted/50 border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <h4 className="font-extrabold text-foreground text-sm uppercase">Ask the AI Coach</h4>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={coachQuestion}
                  onChange={(e) => setCoachQuestion(e.target.value)}
                  placeholder="e.g. Why did I score low on structure? or What should I have said about JWT?"
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAskCoach(); }}
                />
                <Button
                  onClick={handleAskCoach}
                  disabled={isCoachLoading || !coachQuestion.trim()}
                  className="h-10 px-5 rounded-xl font-bold text-xs"
                >
                  {isCoachLoading ? 'Thinking...' : 'Ask Coach'}
                </Button>
              </div>

              {isCoachLoading && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              )}

              {coachAnswer && !isCoachLoading && (
                <div className="p-4 bg-background border border-border rounded-xl text-sm leading-relaxed animate-fade-in">
                  <span className="text-[10px] font-black uppercase text-primary block mb-1">AI Coach Response</span>
                  <p className="text-foreground font-medium">"{coachAnswer}"</p>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="w-full h-12 rounded-[0.9rem] font-bold text-base"
              onClick={() => {
                playSound('click');
                setCoachQuestion('');
                setCoachAnswer('');
                advanceToNextCard();
              }}
            >
              {currentRound >= sessionConfig.totalRounds ? 'Finish & View Results' : 'Next Card →'}
            </Button>
          </div>
        )}
      </main>

      {sessionState === 'life_lost' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in px-4">
          <div className="bg-background border border-border rounded-[1.5rem] p-8 max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 text-destructive">
              <HeartIcon filled={false} />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Life Burned!</h2>
            <p className="text-muted-foreground mb-8">
              Your explanation didn't hit the mark. The interviewer was confused. You have {livesRemaining} lives left.
            </p>
            <Button
              size="lg"
              className="w-full h-12 rounded-[0.9rem] mb-3"
              onClick={() => { playSound('click'); advanceToNextCard(); }}
            >
              Continue
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 rounded-[0.9rem]"
              onClick={() => { playSound('click'); abandonGame(); router.push('/dashboard'); }}
            >
              Quit Game
            </Button>
          </div>
        </div>
      )}

      {sessionState === 'game_over' && results && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-card border border-border rounded-[2rem] p-6 sm:p-8 shadow-2xl relative animate-scale-up">
            {/* Header */}
            <div className="text-center mb-6">
              <span className={`text-5xl mb-3 inline-block ${results.outcome === 'completed' ? 'animate-bounce' : ''}`}>
                {results.outcome === 'completed' ? '🏆' : '💀'}
              </span>
              <h2 className={`text-3xl font-black uppercase tracking-wider mb-2 ${results.outcome === 'completed' ? 'text-primary' : 'text-destructive'}`}>
                {results.outcome === 'completed' ? 'Assessment Completed' : 'Session Terminated'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {results.outcome === 'completed'
                  ? 'Excellent work! The interviewer has graded your articulation performance.'
                  : 'You ran out of lives. Keep practicing to master these concepts!'}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted p-4 rounded-2xl border border-border text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Overall Rating</span>
                <p className="text-4xl font-black text-foreground">{results.finalScore}/100</p>
              </div>
              <div className="bg-muted p-4 rounded-2xl border border-border text-center flex flex-col justify-center items-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">XP Earned</span>
                <p className="text-4xl font-black text-green-500">+{results.totalXp} XP</p>
              </div>
            </div>

            {/* Average Scores Breakdown */}
            <div className="bg-muted/50 border border-border rounded-2xl p-4 sm:p-6 mb-6">
              <h3 className="font-extrabold text-foreground text-sm uppercase tracking-wider mb-4">Core Dimensions</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <ScoreMeter label="Clarity" score={Math.round(results.cardBreakdown.reduce((acc, c) => acc + c.clarity, 0) / Math.max(results.cardBreakdown.length, 1))} />
                <ScoreMeter label="Structure" score={Math.round(results.cardBreakdown.reduce((acc, c) => acc + c.structure, 0) / Math.max(results.cardBreakdown.length, 1))} />
                <ScoreMeter label="Depth" score={Math.round(results.cardBreakdown.reduce((acc, c) => acc + c.depth, 0) / Math.max(results.cardBreakdown.length, 1))} />
                <ScoreMeter label="Brevity" score={Math.round(results.cardBreakdown.reduce((acc, c) => acc + c.brevity, 0) / Math.max(results.cardBreakdown.length, 1))} />
              </div>
            </div>

            {/* General Feedback */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl mb-6">
              <h4 className="font-extrabold text-primary text-xs mb-1 uppercase tracking-wide">AI Panel Feedback</h4>
              <p className="text-sm text-foreground leading-relaxed">{results.agentSummary.overall}</p>
            </div>

            {/* Cards Breakdown List */}
            <div className="mb-6 space-y-2 max-h-40 overflow-y-auto pr-1">
              <h4 className="font-extrabold text-foreground text-xs uppercase tracking-wide mb-2">Question Breakdown</h4>
              {results.cardBreakdown.map((res, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/30 border border-border rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold text-primary block">{res.card.category.toUpperCase()}</span>
                    <span className="text-sm font-medium text-foreground">{res.card.title}</span>
                  </div>
                  <span className={`text-sm font-bold ${res.totalScore >= 70 ? 'text-green-500' : 'text-destructive'}`}>
                    {res.totalScore}/100
                  </span>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button size="lg" className="h-12 rounded-[0.9rem] font-bold text-base" onClick={() => { playSound('click'); startGame(); }}>
                Play Again
              </Button>
              <Button variant="outline" size="lg" className="h-12 rounded-[0.9rem] font-bold text-base" onClick={() => { playSound('click'); abandonGame(); router.push('/dashboard'); }}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}

      {badgesEarned.length > 0 && (
        <BadgeEarnedOverlay badges={badgesEarned} onClose={() => setBadgesEarned([])} />
      )}

      {/* Level Up Animation Overlay */}
      {results && (results as any).levelUp && !dismissedLevelUp && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="bg-background border-4 border-yellow-500 rounded-[2.5rem] p-8 max-w-md w-full text-center space-y-6 animate-scale-up shadow-2xl shadow-yellow-500/25">
            <div className="relative">
              <span className="text-7xl block animate-bounce">⚡</span>
              <span className="absolute -top-2 -right-2 text-3xl animate-spin">✨</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-yellow-500 tracking-wider uppercase animate-pulse">Level Up!</h2>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Articulate Master Tier Upgraded</p>
            </div>
            <div className="py-4 px-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex justify-center items-center gap-4">
              <span className="text-sm font-black text-muted-foreground line-through">{selectedLevel}</span>
              <span className="text-xl text-yellow-500 font-extrabold">➔</span>
              <span className="text-2xl font-black text-yellow-500">{(results as any).newLevel}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Awesome work! You maintained a high clarity and accuracy score, unlocking the next complexity tier.
            </p>
            <Button
              size="lg"
              className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-black text-base rounded-2xl shadow-lg shadow-yellow-500/30 border-none"
              onClick={() => {
                playSound('success');
                setDismissedLevelUp(true);
              }}
            >
              Continue Challenge
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}