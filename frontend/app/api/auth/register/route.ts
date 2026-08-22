import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || 'http://127.0.0.1:5000'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Auth register proxy failed:', error)
    return NextResponse.json(
      { message: 'Authentication service is unavailable right now.' },
      { status: 503 }
    )
  }
}
