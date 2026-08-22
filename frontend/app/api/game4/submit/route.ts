import { NextResponse } from 'next/server';
import { GOOGLY_PUZZLES } from '@/lib/data/puzzles';

interface SubmitRequest {
  questionId: string;
  selectedOptionId: string;
  confidenceBet: 1 | 2 | 3;
  currentRating: number;
  totalQuestions?: number;
}

export async function POST(request: Request) {
  try {
    const body: SubmitRequest = await request.json();
    const { questionId, selectedOptionId, confidenceBet = 1, currentRating = 0, totalQuestions = 3 } = body;

    const question = GOOGLY_PUZZLES.find(q => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const isCorrect = selectedOptionId === question.correctOptionId;
    const isTrap = selectedOptionId === question.trapOptionId;

    const basePerQ = 100 / Math.max(totalQuestions, 1);
    let delta = 0;
    let confidenceBonus = 0;

    if (isCorrect) {
      confidenceBonus = confidenceBet === 3 ? 10 : (confidenceBet === 2 ? 5 : 0);
      delta = Math.round(basePerQ + confidenceBonus);
    } else if (isTrap) {
      const trapPenalty = confidenceBet === 3 ? 20 : (confidenceBet === 2 ? 12 : 6);
      delta = -trapPenalty;
    } else {
      const wrongPenalty = confidenceBet === 3 ? 10 : (confidenceBet === 2 ? 6 : 3);
      delta = -wrongPenalty;
    }

    const newRating = Math.max(0, Math.min(100, currentRating + delta));
    const xp = (isCorrect ? 100 * confidenceBet : 15) + (confidenceBonus * 5);

    const trapExplanation = isTrap
      ? question.trapExplanation || "You fell for the Googly! That option is the classic intuitive pitfall."
      : (isCorrect 
          ? "Spot on! You sidestepped the common trap and chose the optimal solution." 
          : "Not quite right. Review the underlying constraints.");

    const playerInsight = question.playerInsight || "Analyze the problem using first-principles deduction.";

    return NextResponse.json({
      correctOptionId: question.correctOptionId,
      trapOptionId: question.trapOptionId,
      isCorrect,
      isTrap,
      trapExplanation,
      playerInsight,
      ratingDelta: delta,
      newRating,
      confidenceBonus,
      totalXpAwarded: xp
    });
  } catch (error) {
    console.error('Error in /api/game4/submit:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
