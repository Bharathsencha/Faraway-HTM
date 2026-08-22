import React, { useEffect, useState } from 'react';
import { useTypewriter } from './useTypewriter';
import { Button } from '../ui/button';

export function BossRoundIntro({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3);
  
  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center animate-fade-in">
      <h1 className="text-destructive text-6xl font-black tracking-widest uppercase animate-pulse mb-8">
        The Final Googly
      </h1>
      <div className="text-white text-8xl font-bold">{count > 0 ? count : 'GO'}</div>
    </div>
  );
}

export function GooglyRatingMeter({ rating, delta }: { rating: number, delta: number | null }) {
  const getColor = () => {
    if (rating >= 80) return 'bg-purple-500';
    if (rating >= 50) return 'bg-primary';
    if (rating >= 30) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  return (
    <div className="w-full bg-background border border-border rounded-full h-4 relative overflow-hidden">
      <div 
        className={`h-full transition-all duration-1000 ease-out ${getColor()}`} 
        style={{ width: `${rating}%` }} 
      />
      {delta !== null && (
        <span className={`absolute top-0 right-2 text-xs font-bold ${delta > 0 ? 'text-green-500' : 'text-destructive'} animate-slide-up`}>
          {delta > 0 ? '+' : ''}{delta}
        </span>
      )}
    </div>
  );
}

export function ConfidenceBet({ bet, onSelect, disabled }: { bet: 1|2|3|null, onSelect: (v: 1|2|3) => void, disabled: boolean }) {
  return (
    <div className="flex flex-col items-center mb-8">
      <p className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">How confident are you?</p>
      <div className="flex gap-4">
        {[1, 2, 3].map((val) => (
          <button
            key={val}
            disabled={disabled}
            onClick={() => onSelect(val as 1|2|3)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'
            } ${bet && bet >= val ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={bet && bet >= val ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
        ))}
      </div>
    </div>
  );
}