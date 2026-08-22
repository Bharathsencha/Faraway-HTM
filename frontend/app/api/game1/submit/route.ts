import { NextResponse } from 'next/server'

interface Answer {
  segmentId: number
  transcript: string
  fillerWordCount: number
}

interface SubmitRequest {
  sessionId: string
  answers: Answer[]
}

export async function POST(request: Request) {
  try {
    const body: SubmitRequest = await request.json()
    const { sessionId, answers } = body

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'sessionId and answers array are required.' },
        { status: 400 }
      )
    }

    // Calculate metrics
    let totalFillerWords = 0
    let totalLength = 0
    let validAnswersCount = 0

    answers.forEach((ans) => {
      totalFillerWords += ans.fillerWordCount || 0
      if (ans.transcript && ans.transcript.trim()) {
        totalLength += ans.transcript.trim().length
        validAnswersCount++
      }
    })

    const avgLength = validAnswersCount > 0 ? totalLength / validAnswersCount : 0

    // Determine verdict
    let verdict: 'reject' | 'borderline' | 'clear' = 'borderline'
    let finalReadinessScore = 55

    if (validAnswersCount < 3 || avgLength < 40) {
      verdict = 'reject'
      finalReadinessScore = Math.max(15, 20 + Math.floor(Math.random() * 20))
    } else if (totalFillerWords > 12 || avgLength < 120) {
      verdict = 'borderline'
      finalReadinessScore = 50 + Math.floor(Math.random() * 20)
    } else {
      verdict = 'clear'
      finalReadinessScore = 75 + Math.min(23, Math.floor(Math.random() * 20) + (10 - Math.min(10, totalFillerWords)))
    }

    // Generate structured, custom feedback letter
    let feedbackLetter = ''

    if (verdict === 'reject') {
      feedbackLetter = `Dear Candidate,

Thank you for completing this practice session with Interview Arena. Based on your responses, we have compiled your performance report.

At this stage, your readiness score indicates that further preparation is required before you engage in live interviews.

Major Feedback Areas:
1. Response Depth: Your answers were brief and lacked the structural details necessary to fully describe your contributions and technical decisions. In professional settings, interviewers expect deep-dives into your problem-solving methodologies.
2. STAR Structure: Try utilizing the Situation, Task, Action, and Result (STAR) framework. Make sure to define the initial context clearly and explicitly outline the technical decisions you made.
3. Communication & Flow: There were noticeable gaps in execution, and the live responses did not provide enough substance to demonstrate your technical depth or domain competency.

Recommendations for next steps:
* Practice expanding on your achievements by elaborating on the technical challenges, tradeoffs, and end-to-end impact.
* Focus on refining your project descriptions. We recommend writing down bullet points for 3 major projects using the STAR layout and practicing them aloud.

We look forward to seeing your progress in your next session. Keep practicing!`
    } else if (verdict === 'borderline') {
      feedbackLetter = `Dear Candidate,

Thank you for completing this practice session with Interview Arena. We have evaluated your performance and mapped out key strengths and areas of improvement.

Your performance was solid, placing you in the "Borderline" range. With focused practice, you can easily shift this into a confident "Clear" verdict.

Major Feedback Areas:
1. Verbal Fluency: We observed a total of ${totalFillerWords} filler words (such as "um", "uh", "like") during your responses. While natural in conversation, minimizing these will significantly boost your perceived authority and clarity.
2. Structure: You did a good job describing the situations and tasks, but the actions you took and the results you achieved could be more pronounced. Don't gloss over the "Action" part of your stories—this is where your technical expertise shines.
3. Concise Delivery: In some segments, the responses started strong but drifted slightly off-topic. Focus on keeping your answers tight and directly aligned with the interviewer's prompt.

Recommendations for next steps:
* Try recording yourself while consciously pausing instead of using filler words when you need a moment to think.
* Make sure every technical story concludes with a clear, quantifiable impact or business result.

Keep up the great effort! You are very close to being fully interview-ready.`
    } else {
      feedbackLetter = `Dear Candidate,

Congratulations on completing your practice session! Your performance was exceptionally strong, resulting in a "Clear" recommendation.

You demonstrated a high level of communication clarity, technical awareness, and structural consistency throughout the session.

Major Strengths:
1. Excellent Delivery: Your verbal fluency was superb, with only ${totalFillerWords} filler words detected. Your pacing was professional, clear, and easy to follow.
2. Detailed Action & Impact: You did an outstanding job showcasing your direct contributions, explaining the technical tradeoffs, and presenting the final outcomes.
3. Role & Company Alignment: Your answers showed good alignment with the role expectations and reflected a solid understanding of the company's culture and values.

Areas to Polish:
* Continue refining your stories to make them even more concise.
* When speaking about technical tradeoffs, consider highlighting alternative approaches you discarded and why.

You are showing excellent readiness for live interviews. Keep this momentum going!`
    }

    return NextResponse.json({
      verdict,
      verdictLetter: feedbackLetter,
      finalReadinessScore
    })
  } catch (error) {
    console.error('Error in /api/game1/submit:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
