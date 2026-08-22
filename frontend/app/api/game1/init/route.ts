import { NextResponse } from 'next/server'

interface InitRequest {
  companyName: string
  role: string
  resumeText: string
}

export async function POST(request: Request) {
  try {
    const body: InitRequest = await request.json()
    const { companyName, role, resumeText } = body

    if (!companyName || !role || !resumeText) {
      return NextResponse.json(
        { error: 'companyName, role, and resumeText are required.' },
        { status: 400 }
      )
    }

    // Generate session ID
    const sessionId = `sess_${Math.random().toString(36).substring(2, 11)}`

    // Generate Interviewer Persona
    const personas = ['Bar Raiser', 'Technical Lead', 'Hiring Manager', 'VP of Engineering', 'Senior Architect']
    const randomPersona = personas[Math.floor(Math.random() * personas.length)]
    const interviewerPersona = `${companyName} ${randomPersona}`

    // Calculate a simulated initial readiness score (40 - 75)
    const seed = companyName.length + role.length + resumeText.length
    const estimatedReadiness = 40 + (seed % 35)

    // Generate tailored questions based on company and role
    const questionBank = [
      {
        id: 1,
        text: `Welcome! Let's kick off with standard introductions. Could you walk me through your background and explain why you're interested in the ${role} position at ${companyName}?`
      },
      {
        id: 2,
        text: `A key part of being a ${role} is technical execution. Can you describe a challenging technical project you worked on recently? What was your approach, and how did you measure success?`
      },
      {
        id: 3,
        text: `Here at ${companyName}, collaboration is critical. Tell me about a time you had a difference of opinion with a colleague or manager. How did you resolve it, and what did you learn?`
      },
      {
        id: 4,
        text: `How do you handle situations where requirements are ambiguous or you face a tight deadline? Walk me through a specific instance where this happened.`
      },
      {
        id: 5,
        text: `Finally, why do you want to join ${companyName} specifically, and how do you see yourself contributing to the engineering culture here?`
      }
    ]

    return NextResponse.json({
      sessionId,
      questionBank,
      interviewerPersona,
      estimatedReadiness
    })
  } catch (error) {
    console.error('Error in /api/game1/init:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
