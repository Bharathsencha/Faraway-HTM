import { NextResponse } from 'next/server';
import { getRandomQuestions, GOOGLY_PUZZLES } from '@/lib/data/puzzles';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const count = typeof body.count === 'number' ? Math.min(Math.max(body.count, 1), 10) : 3;

    const sessionId = `g4_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const questions = getRandomQuestions(count);

    return NextResponse.json({
      sessionId,
      totalRounds: questions.length,
      initialRating: 50,
      questions
    });
  } catch (error) {
    console.error('Error in /api/game4/init:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  const questions = getRandomQuestions(3);
  return NextResponse.json({
    totalAvailablePuzzles: GOOGLY_PUZZLES.length,
    sampleSession: questions
  });
}
