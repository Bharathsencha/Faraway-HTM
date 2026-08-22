import { NextResponse } from 'next/server'

interface InitRequest {
  companyName: string
  role: string
  currentOffer: number
  resumeText?: string
  predictedSalary?: number
  salaryUnit?: 'thousand' | 'lakh' | 'crore'
}

export async function POST(request: Request) {
  try {
    const body: InitRequest = await request.json()
    const { companyName, role, currentOffer } = body

    if (!companyName || !role || !currentOffer || isNaN(Number(currentOffer))) {
      return NextResponse.json(
        { error: 'companyName, role, and currentOffer are required.' },
        { status: 400 }
      )
    }

    const sessionId = `poker_${Math.random().toString(36).substring(2, 11)}`
    const offerNum = Number(currentOffer)
    const minRange = Math.round(offerNum * 0.85)
    const maxRange = Math.round(offerNum * 1.35)
    const marketAverage = Math.round(minRange + (maxRange - minRange) * 0.45)

    const fundingStatuses = ['Series C ($45M raised)', 'Series B ($18M raised)', 'Profitable (Bootstrapped)', 'IPO (Public)', 'Series A ($8M raised)']
    const fundingStatus = fundingStatuses[Math.floor(Math.random() * fundingStatuses.length)]

    const hiringFreezes = ['No freeze (Hiring aggressively)', 'No freeze (Moderate growth)', 'Selective hiring (Budget adjustments)', 'No freeze (Expanding teams)']
    const hiringFreezeInfo = hiringFreezes[Math.floor(Math.random() * hiringFreezes.length)]

    return NextResponse.json({
      sessionId,
      companyRange: { min: minRange, max: maxRange },
      fundingStatus,
      hiringFreezeInfo,
      marketAverage,
      baseSalary: offerNum
    })
  } catch (error) {
    console.error('Error in /api/game2/init:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
