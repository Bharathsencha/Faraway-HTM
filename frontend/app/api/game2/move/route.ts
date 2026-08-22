import { NextResponse } from 'next/server'

function formatINR(amount: number): string {
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
}

interface MoveRequest {
  sessionId: string
  round: number
  moveType: 'counter' | 'justify' | 'trade' | 'walk'
  counterAmount?: number
  justificationText?: string
  history: Array<{
    round: number
    moveType: 'counter' | 'justify' | 'trade' | 'walk'
    counterAmount?: number
    hrResponse: string
    hrCounterOffer: number
  }>
  baseSalary: number
  companyRange: { min: number; max: number }
  marketAverage: number
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length
}

export async function POST(request: Request) {
  try {
    const body: MoveRequest = await request.json()
    const { sessionId, round, moveType, counterAmount, justificationText, history, baseSalary, companyRange, marketAverage } = body

    if (!sessionId || !round || !moveType || !baseSalary || !companyRange || !marketAverage) {
      return NextResponse.json(
        { error: 'Required fields are missing.' },
        { status: 400 }
      )
    }

    const currentHROffer = history.length > 0 ? history[history.length - 1].hrCounterOffer : baseSalary
    let hrCounterOffer = currentHROffer
    let hrResponse = ''
    let hrMoveType: 'accept' | 'counter' | 'reject' = 'counter'
    let isGameOver = false
    let isPaused = false
    let verdict: 'win' | 'lose' | 'fail' | 'perfect_win' | null = null
    let feedback = ''

    const isLastRound = round >= 4
    const hasWalkedBefore = history.some((entry) => entry.moveType === 'walk')
    const currentHROfferBeforeMove = currentHROffer
    const finalOfferTarget = 2300000
    const perfectWinTarget = 2470000

    switch (moveType) {
      case 'walk':
        isGameOver = true
        hrMoveType = 'reject'
        hrCounterOffer = baseSalary
        hrResponse = "I'm sorry we couldn't reach an agreement. Since you've chosen to walk away, we will have to withdraw the offer and move forward with other candidates."
        verdict = 'fail'
        feedback = 'Walk Away ends the negotiation immediately.'
        break
      case 'counter':
        const counterVal = Number(counterAmount)
        if (!counterVal || isNaN(counterVal)) {
          return NextResponse.json({ error: 'Valid counterAmount is required for Counter Offer.' }, { status: 400 })
        }

        if (counterVal > companyRange.max * 1.6) {
          isGameOver = true
          hrMoveType = 'reject'
          hrCounterOffer = baseSalary
          hrResponse = `Honestly, ${formatINR(counterVal)} is way outside our approved budget range for this role. We feel our expectations are too far apart, and we are withdrawing our offer.`
          verdict = 'lose'
          feedback = 'Countering 60% above the company max withdraws the offer.'
        } else if (round === 1 && counterVal <= currentHROffer) {
          isGameOver = true
          hrMoveType = 'accept'
          hrCounterOffer = currentHROffer
          hrResponse = 'You countered with an amount equal to or lower than our current offer. We are happy to lock in this offer.'
          verdict = 'lose'
          feedback = 'Accepting the Round 1 offer without countering loses the negotiation.'
        } else if (history.length > 0 && counterVal < currentHROffer) {
          isPaused = true
          hrMoveType = 'counter'
          hrCounterOffer = Math.max(baseSalary, currentHROffer - 100000)
          hrResponse = `That counter moves backwards from ${formatINR(currentHROffer)} to ${formatINR(counterVal)}. The pot loses Rs. 1 lakh, and you can retry this round.`
          verdict = 'lose'
          feedback = 'Your counter went lower than the last counter. The pot loses Rs. 1 lakh, but you can retry.'
        } else {
          const diff = counterVal - currentHROffer
          const gapFiller = diff * 0.45
          hrCounterOffer = Math.round(currentHROffer + gapFiller)

          if (isLastRound) {
            if (hrCounterOffer > perfectWinTarget) {
              hrCounterOffer = counterVal
              hrMoveType = 'accept'
              isGameOver = true
              verdict = 'perfect_win'
              hrResponse = `We value your skillset highly and are prepared to meet your request. We accept your counteroffer of ${formatINR(counterVal)} base salary.`
              feedback = 'Perfect Win secured above Rs. 24.7 lakh.'
            } else if (hrCounterOffer > finalOfferTarget) {
              hrCounterOffer = counterVal
              hrMoveType = 'accept'
              isGameOver = true
              verdict = 'win'
              hrResponse = `We value your skillset highly and are prepared to meet your request. We accept your counteroffer of ${formatINR(counterVal)} base salary.`
              feedback = 'Good Win secured above Rs. 23 lakh.'
            } else if (hrCounterOffer === baseSalary) {
              hrMoveType = 'reject'
              isGameOver = true
              verdict = 'lose'
              hrResponse = `We have left the offer unchanged at ${formatINR(hrCounterOffer)}. You left money on the table.`
              feedback = 'Final offer equals the starting offer. Game over.'
            } else {
              hrMoveType = 'reject'
              isGameOver = true
              verdict = 'lose'
              hrResponse = `We have reached the limit of our budget. Our final offer remains ${formatINR(hrCounterOffer)}. We cannot negotiate any further.`
              feedback = "The negotiation ended below the target range."
            }
          } else if (counterVal <= currentHROffer) {
            isPaused = true
            hrCounterOffer = Math.max(baseSalary, currentHROffer - 100000)
            hrResponse = `That move accepts too early. The pot loses Rs. 1 lakh, and you can retry the round.`
            verdict = 'lose'
            feedback = 'Accepting too early pauses the game and lets you retry.'
          } else if (hrCounterOffer >= companyRange.max * 0.95) {
            hrCounterOffer = counterVal
            hrMoveType = 'accept'
            isGameOver = true
            verdict = 'perfect_win'
            hrResponse = `We value your skillset highly and are prepared to meet your request. We accept your counteroffer of ${formatINR(counterVal)} base salary.`
            feedback = 'Perfect negotiation! You secured the best package.'
          } else {
            hrResponse = `We understand you are looking for more, but we can't quite do ${formatINR(counterVal)}. However, we can meet you partway at ${formatINR(hrCounterOffer)}.`
            hrMoveType = 'counter'
          }
        }
        break
      case 'justify':
        const justificationWords = wordCount(justificationText || '')
        const hasNumber = /\d/.test(justificationText || '')

        if (justificationWords < 10 || !hasNumber) {
          isPaused = true
          hrCounterOffer = currentHROffer
          hrMoveType = 'counter'
          hrResponse = 'That justification is too short or has no numbers. The game pauses so you can retry with stronger evidence.'
          verdict = 'lose'
          feedback = 'Justify needs at least 10 words and a number.'
        } else {
          const bump = Math.round((companyRange.max - companyRange.min) * 0.08)
          hrCounterOffer = Math.min(companyRange.max, currentHROffer + bump)
          hrMoveType = 'counter'
          hrResponse = `Your experience and market data details are compelling. We've gone back to the compensation committee and successfully increased our base salary offer to ${formatINR(hrCounterOffer)}.`
        }
        break
      case 'trade':
        const tradeBump = Math.round((companyRange.max - companyRange.min) * 0.05)
        hrCounterOffer = Math.min(companyRange.max, currentHROffer + tradeBump)
        hrMoveType = 'counter'
        hrResponse = `We can definitely look at alternative benefits. In exchange for the adjusted base salary of ${formatINR(hrCounterOffer)}, we will add a Rs. 5,000 sign-on bonus and grant an extra 5 days of paid time off.`
        break
    }

    if (hasWalkedBefore && moveType === 'walk') {
      isGameOver = true
      verdict = 'fail'
      feedback = 'Walking away twice ends the game.'
    }

    if (isLastRound && !isGameOver && !isPaused) {
      isGameOver = true
      if (hrCounterOffer > perfectWinTarget) {
        verdict = 'perfect_win'
        hrMoveType = 'accept'
        hrResponse = `This is our final offer of ${formatINR(hrCounterOffer)}. We hope you'll join us!`
        feedback = 'Perfect Win secured above Rs. 24.7 lakh.'
      } else if (hrCounterOffer > finalOfferTarget) {
        verdict = 'win'
        hrMoveType = 'accept'
        hrResponse = `This is our final offer of ${formatINR(hrCounterOffer)}. We hope you'll join us!`
        feedback = 'Good Win secured above Rs. 23 lakh.'
      } else if (hrCounterOffer === baseSalary) {
        verdict = 'lose'
        hrMoveType = 'reject'
        hrResponse = `We have left the offer unchanged at ${formatINR(hrCounterOffer)}. You left money on the table.`
        feedback = 'Final offer equals the starting offer. Game over.'
      } else {
        verdict = 'lose'
        hrMoveType = 'reject'
        hrResponse = `We have reached the limit of our budget. Our final offer remains ${formatINR(hrCounterOffer)}. We cannot negotiate any further.`
        feedback = 'The negotiation ended below the target range.'
      }
    }

    const salaryDelta = hrCounterOffer - baseSalary

    return NextResponse.json({
      hrResponse,
      hrCounterOffer,
      hrMoveType,
      salaryDelta,
      isPaused,
      isGameOver,
      verdict,
      feedback
    })
  } catch (error) {
    console.error('Error in /api/game2/move:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
