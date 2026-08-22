'use client'

import { createElement, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { HowItWorks } from '@/components/how-it-works'
import { ProblemSolution } from '@/components/problem-solution'
import { CTA } from '@/components/cta'
import { Footer } from '@/components/footer'
import { AuthModal } from '@/components/auth-modal'
import { OnboardingFlow, type OnboardingData } from '@/components/onboarding-flow'
import { useTheme } from '@/app/theme-provider'
import { apiRequest, type AuthUser } from '@/lib/auth'

interface DashboardProfile {
  goal?: string
  user_type?: string
  problems?: string[]
  onboarding_completed?: boolean
}

interface DashboardProfileResponse {
  profile: DashboardProfile
}

function hasCompletedOnboarding(profile: DashboardProfile): boolean {
  const hasSavedAnswers = Boolean(
    profile.goal?.trim() ||
    profile.user_type?.trim() ||
    (profile.problems && profile.problems.length > 0),
  )

  return Boolean(profile.onboarding_completed || hasSavedAnswers)
}

export default function Home() {
  const router = useRouter()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    setMounted(true)
    const storedToken = localStorage.getItem('authToken')
    const storedUser = localStorage.getItem('authUser')
    if (!storedToken || !storedUser) {
      localStorage.removeItem('authUser')
      return
    }

    try {
      setAuthUser(JSON.parse(storedUser) as AuthUser)
    } catch (e) {
      console.error('Failed to parse stored auth user:', e)
      localStorage.removeItem('authUser')
    }
  }, [])

  const handleSignInClick = (): void => setIsAuthModalOpen(true)
  const handleStartClick = (): void => {
    if (authUser) {
      router.push('/dashboard')
    } else {
      setIsAuthModalOpen(true)
    }
  }
  const handleCloseAuthModal = (): void => setIsAuthModalOpen(false)
  const handleSignOut = (): void => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    localStorage.removeItem('userOnboardingData')
    setAuthUser(null)
    setIsOnboardingOpen(false)
    router.push('/')
  }

  const handleAuthSuccess = async (userData: AuthUser): Promise<void> => {
    setAuthUser(userData)
    const token = localStorage.getItem('authToken')
    if (!token) {
      setIsOnboardingOpen(true)
      return
    }

    try {
      const result = await apiRequest<DashboardProfileResponse>('/api/dashboard/profile', { token })
      if (hasCompletedOnboarding(result.profile)) {
        setIsOnboardingOpen(false)
        router.push('/dashboard')
        return
      }
    } catch (e) {
      console.error('Failed to load onboarding status:', e)
    }

    setIsOnboardingOpen(true)
  }

  const handleOnboardingComplete = async (data: OnboardingData): Promise<void> => {
    const token = localStorage.getItem('authToken')
    if (token) {
      try {
        await apiRequest('/api/dashboard/profile', {
          method: 'PUT',
          token,
          body: {
            goal: data.goal,
            userType: data.userType,
            problems: data.problems,
            onboardingCompleted: true,
          },
        })
      } catch (e) {
        console.error('Failed to save onboarding data to backend:', e)
      }
    }
    setIsOnboardingOpen(false)
    router.push('/dashboard')
  }

  const handleOnboardingSkip = async (): Promise<void> => {
    setIsOnboardingOpen(false)
    const token = localStorage.getItem('authToken')
    if (token) {
      try {
        await apiRequest('/api/dashboard/profile', {
          method: 'PUT',
          token,
          body: {
            goal: 'Not specified',
            userType: 'Not specified',
            problems: [],
            onboardingCompleted: true,
          },
        })
      } catch (e) {
        console.error('Failed to save onboarding data to backend:', e)
      }
    }
    router.push('/dashboard')
  }

  const pageBackground = theme === 'dark'
    ? 'radial-gradient(circle at top left, rgba(255, 106, 42, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(255, 210, 162, 0.12), transparent 24%), linear-gradient(180deg, #140f0b 0%, #1a1410 52%, #120d0a 100%)'
    : 'radial-gradient(circle at top left, rgba(255, 142, 82, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(255, 206, 156, 0.35), transparent 24%), linear-gradient(180deg, #fffaf3 0%, #fff2e5 50%, #ffe2c8 100%)'

  const shell = createElement(
    'main',
    { className: 'min-h-screen', style: { background: pageBackground } },
    createElement(Navbar, { onSignInClick: handleSignInClick, authUser, onSignOut: handleSignOut }),
    createElement(Hero, { onStartClick: handleStartClick }),
    createElement(ProblemSolution, null),
    createElement(Features, null),
    createElement(HowItWorks, null),
    createElement(CTA, { onStartClick: handleStartClick }),
    createElement(Footer, null),
    createElement(AuthModal, { isOpen: isAuthModalOpen, onClose: handleCloseAuthModal, theme, onAuthSuccess: handleAuthSuccess }),
    createElement(OnboardingFlow, { isOpen: isOnboardingOpen, onComplete: handleOnboardingComplete, onSkip: handleOnboardingSkip }),
  )

  if (!mounted) return shell
  return shell
}
