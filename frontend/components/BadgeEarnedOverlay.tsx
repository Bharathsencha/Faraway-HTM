'use client';

import React, { useEffect } from 'react';
import { Button } from './ui/button';

interface Badge {
  name: string;
  icon: string;
  description: string;
}

interface BadgeEarnedOverlayProps {
  badges: Badge[];
  onClose: () => void;
}

export default function BadgeEarnedOverlay({ badges, onClose }: BadgeEarnedOverlayProps) {
  useEffect(() => {
    try {
      const audio = new Audio('/sounds/success.mp3');
      audio.play().catch(() => {});
    } catch (e) {}
  }, []);

  if (!badges || badges.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full bg-card border-2 border-primary rounded-[2rem] p-8 text-center shadow-2xl shadow-primary/20 animate-scale-up relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-2xl" />

        <div className="text-7xl mb-4 animate-bounce">🏆</div>
        
        <h2 className="text-3xl font-black text-foreground uppercase tracking-wider mb-1">
          {badges.length > 1 ? 'New Badges Unlocked!' : 'New Badge Unlocked!'}
        </h2>
        <p className="text-muted-foreground text-xs mb-6 uppercase tracking-widest font-bold">
          Platform Achievement
        </p>

        <div className="space-y-4 mb-8">
          {badges.map((badge, idx) => (
            <div key={idx} className="bg-muted border border-border p-4 rounded-2xl flex items-center gap-4 text-left animate-slide-up">
              <span className="text-4xl bg-background p-2.5 rounded-xl border border-border shadow-sm">{badge.icon}</span>
              <div>
                <h4 className="font-extrabold text-foreground text-base leading-snug">{badge.name}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>

        <Button 
          size="lg" 
          className="w-full h-12 rounded-[0.9rem] font-bold text-base shadow-lg shadow-primary/30"
          onClick={onClose}
        >
          Collect Reward
        </Button>
      </div>
    </div>
  );
}
