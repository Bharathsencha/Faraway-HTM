import React, { useEffect, useState } from 'react';

export function ScoreMeter({ label, score }: { label: string, score: number }) {
  const [fill, setFill] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setFill((score / 25) * 100), 300);
    return () => clearTimeout(timer);
  }, [score]);

  // Use theme colors instead of hardcoded greens and yellows
  const getColorClass = () => {
    if (score >= 18) return 'bg-primary'; // Strong score, strong brand orange
    if (score >= 12) return 'bg-primary/60'; // Mid score, faded orange
    return 'bg-muted-foreground'; // Low score, greyed out
  };

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-sm font-semibold mb-1 text-foreground">
        <span>{label}</span>
        <span>{score}/25</span>
      </div>
      <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border">
        <div 
          className={`h-full transition-all duration-1000 ease-out rounded-full ${getColorClass()}`}
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}