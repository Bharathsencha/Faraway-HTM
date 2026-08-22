'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGame4 } from '../../../components/game4/Game4Context';
import { useTypewriter } from '../../../components/game4/useTypewriter';
import { Button } from '../../../components/ui/button';
import { GooglyRatingMeter, ConfidenceBet } from '../../../components/game4/UIComponents';

export default function GooglyMasterSession() {
  const router = useRouter();
  const {
    sessionId, sessionState, currentQuestion, currentRound, totalRounds, googlyRating,
    confidenceBet, selectedOptionId, optionStates, typewriterDone,
    hintText, usedLifelines, revealResult, isSubmitting,
    setConfidenceBet, selectOption, setTypewriterDone,
    useLifeline, submitAnswer, startGame, advanceToNextQuestion, abandonGame
  } = useGame4();

  const playSound = (type: 'click' | 'success' | 'fail' | 'trap') => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const { displayedText, isComplete } = useTypewriter(currentQuestion?.questionText || '', 20);

  useEffect(() => {
    if (!sessionId && sessionState === 'lobby') {
      startGame();
    }
  }, [sessionId, sessionState, startGame]);

  useEffect(() => {
    if (isComplete) setTypewriterDone(true);
  }, [isComplete, setTypewriterDone]);

  useEffect(() => {
    if (sessionState === 'revealing' && revealResult) {
      if (revealResult.isTrap) playSound('trap');
      else if (revealResult.isCorrect) playSound('success');
      else playSound('fail');
    }
  }, [sessionState, revealResult]);

  // Assessment Complete / Game Over Screen
  if (sessionState === 'game_over') {
    const getVerdict = (rating: number) => {
      if (rating >= 80) return { title: 'Trap Immunity Master', desc: 'Incredible first-principles deduction. You consistently dodged deceptive interview traps!' };
      if (rating >= 50) return { title: 'Sharp Thinker', desc: 'Solid problem-solving instincts. Keep practicing boundary conditions and subtle trap formulations.' };
      return { title: 'Trap Susceptible', desc: 'You fell for a few classic interview googlies. Review the insights to avoid intuitive heuristics.' };
    };

    const verdict = getVerdict(googlyRating);

    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
            🎯 Assessment Complete
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">{verdict.title}</h2>
          
          <div className="bg-muted p-6 rounded-2xl border border-border">
            <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider mb-2">Final Googly Rating</p>
            <p className="text-6xl font-black text-primary mb-3">{googlyRating}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{verdict.desc}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button size="lg" className="font-bold" onClick={() => { playSound('click'); startGame(); }}>
              Play Again
            </Button>
            <Button variant="outline" size="lg" className="font-bold" onClick={() => { playSound('click'); abandonGame(); router.push('/dashboard'); }}>
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const isBoss = currentQuestion.difficulty === 'boss';

  return (
    <div className={`min-h-screen flex flex-col pt-8 px-4 pb-20 ${isBoss ? 'bg-destructive/5' : 'bg-muted'}`}>
      
      <header className="max-w-3xl w-full mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={usedLifelines['50_50'] || sessionState !== 'playing' || !typewriterDone}
              onClick={() => { playSound('click'); useLifeline('50_50'); }}
              className="text-xs font-semibold"
            >
              ✂️ 50/50
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={usedLifelines['hint'] || sessionState !== 'playing' || !typewriterDone}
              onClick={() => { playSound('click'); useLifeline('hint'); }}
              className="text-xs font-semibold"
            >
              💡 Ask AI Hint
            </Button>
          </div>
          <div className="text-muted-foreground font-semibold uppercase tracking-widest text-sm">
            {isBoss ? '🔥 FINAL GOOGLY' : `Q${currentRound} / ${totalRounds}`}
          </div>
          <Button variant="ghost" size="sm" onClick={() => { playSound('click'); abandonGame(); router.push('/dashboard'); }}>
            Quit
          </Button>
        </div>
        <GooglyRatingMeter rating={googlyRating} delta={revealResult?.ratingDelta || null} />
      </header>

      <main className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
        <div className={`bg-background border ${isBoss ? 'border-destructive shadow-lg shadow-destructive/20' : 'border-border shadow-sm'} rounded-[1.25rem] p-8 mb-8 relative animate-slide-up`}>
          {isBoss && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-destructive text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              Boss Round
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
              {currentQuestion.category}
            </span>
            {currentQuestion.company && (
              <span className="text-xs font-semibold text-muted-foreground bg-muted border border-border px-3 py-1 rounded-full">
                🏢 {currentQuestion.company}
              </span>
            )}
          </div>

          {currentQuestion.title && (
            <h3 className="text-lg font-bold text-foreground mb-2">
              {currentQuestion.title}
            </h3>
          )}

          <h2 className="text-xl sm:text-2xl font-semibold text-foreground leading-relaxed min-h-[100px]">
            {displayedText}
            {!isComplete && <span className="inline-block w-2 h-6 bg-primary ml-1 animate-pulse" />}
          </h2>

          {hintText && (
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-[1rem] text-sm text-foreground flex gap-3 animate-slide-up">
              <span className="text-xl">🤖</span>
              <div>
                <p className="font-bold text-primary mb-0.5">AI Lifeline Hint:</p>
                <p className="leading-relaxed">{hintText}</p>
              </div>
            </div>
          )}
        </div>

        <div className={`transition-opacity duration-500 ${typewriterDone ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <ConfidenceBet bet={confidenceBet} onSelect={(v) => { playSound('click'); setConfidenceBet(v); }} disabled={sessionState !== 'playing'} />
          
          <div className="grid gap-3 mb-8">
            {currentQuestion.options?.map((opt) => {
              const state = optionStates[opt.id];
              let btnClass = "border-border bg-background text-foreground hover:border-primary";
              
              if (state === 'eliminated') btnClass = "border-border bg-muted text-muted-foreground opacity-40 line-through pointer-events-none";
              else if (state === 'selected') btnClass = "border-primary bg-primary/10 text-primary ring-2 ring-primary";
              else if (state === 'correct') btnClass = "border-green-500 bg-green-500/10 text-green-600 ring-2 ring-green-500";
              else if (state === 'trap') btnClass = "border-destructive bg-destructive/10 text-destructive animate-shake relative ring-2 ring-destructive";

              return (
                <button
                  key={opt.id}
                  onClick={() => { playSound('click'); selectOption(opt.id); }}
                  disabled={sessionState !== 'playing' || !typewriterDone || state === 'eliminated'}
                  className={`w-full text-left p-4 rounded-[1rem] border-2 font-medium transition-all ${btnClass} relative`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="leading-relaxed">{opt.text}</span>
                    {state === 'trap' && (
                      <span className="shrink-0 bg-destructive text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        GOOGLY TRAP
                      </span>
                    )}
                    {state === 'correct' && (
                      <span className="shrink-0 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                        CORRECT
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {sessionState === 'playing' && (
            <Button 
              size="lg"
              className="w-full h-12 rounded-[0.9rem] font-bold text-base shadow-sm"
              disabled={!selectedOptionId || !confidenceBet || isSubmitting}
              onClick={() => { playSound('click'); submitAnswer(); }}
            >
              {isSubmitting ? 'Evaluating Googly...' : (!confidenceBet ? 'Place Confidence Bet (1x - 3x) to Lock In' : 'Lock in Answer')}
            </Button>
          )}
        </div>

        {sessionState === 'revealing' && revealResult && (
          <div className="bg-background border border-border rounded-[1.25rem] p-6 mt-6 animate-slide-up shadow-sm mb-8">
            <h3 className={`text-xl font-bold mb-4 ${revealResult.isCorrect ? 'text-green-500' : (revealResult.isTrap ? 'text-destructive' : 'text-orange-500')}`}>
              {revealResult.isCorrect ? '🎯 Perfect Navigation!' : (revealResult.isTrap ? '⚠️ You fell for the Googly Trap!' : '❌ Incorrect')}
            </h3>
            <div className="space-y-4 mb-6 text-sm text-foreground">
              <div className="p-4 bg-muted rounded-[1rem] border border-border">
                <span className="font-bold block mb-1 text-destructive">The Trap Analysis:</span>
                <p className="leading-relaxed text-muted-foreground">{revealResult.trapExplanation}</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-[1rem] border border-primary/20">
                <span className="font-bold block mb-1 text-primary">Key Interview Insight:</span>
                <p className="leading-relaxed">{revealResult.playerInsight}</p>
              </div>
            </div>
            <Button size="lg" className="w-full h-12 rounded-[0.9rem] font-bold text-base" onClick={() => { playSound('click'); advanceToNextQuestion(); }}>
              {currentRound >= totalRounds ? 'View Final Assessment →' : 'Next Question →'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}