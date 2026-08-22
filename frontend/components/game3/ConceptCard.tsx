import React from 'react';
import type { ConceptCard as CardType } from '../../lib/game3.types';

export function ConceptCard({ card }: { card: CardType }) {
  // Using theme-compliant subtle backgrounds instead of harsh semantic colors
  const diffColor = {
    easy: 'bg-primary/10 text-primary',
    medium: 'bg-foreground/10 text-foreground',
    hard: 'bg-destructive/10 text-destructive'
  }[card.difficulty];

  return (
    <div className="bg-background border border-border rounded-[1.25rem] p-8 shadow-sm text-center animate-slide-up">
      <div className="inline-flex items-center gap-2 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${diffColor}`}>
          {card.difficulty}
        </span>
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          {card.category}
        </span>
      </div>
      <h2 className="text-3xl font-bold text-foreground leading-tight">
        {card.title}
      </h2>
      <p className="mt-4 text-muted-foreground text-sm">
        Explain this concept as if you were talking to a Senior Engineer.
      </p>
    </div>
  );
}