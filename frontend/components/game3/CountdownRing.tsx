import React from 'react';

export function CountdownRing({ timeRemaining, totalTime }: { timeRemaining: number, totalTime: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeRemaining / totalTime) * circumference;
  
  const isWarning = timeRemaining <= 30;
  const isCritical = timeRemaining <= 10;
  
  let colorClass = 'text-primary';
  if (isCritical) colorClass = 'text-destructive animate-pulse';
  else if (isWarning) colorClass = 'text-primary/70';

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="64" cy="64" r={radius}
          className="stroke-border fill-none"
          strokeWidth="8"
        />
        <circle
          cx="64" cy="64" r={radius}
          className={`${colorClass} fill-none transition-all duration-1000 ease-linear`}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-foreground">{timeRemaining}</span>
        <span className="text-xs text-muted-foreground mt-[-2px]">SEC</span>
      </div>
    </div>
  );
}