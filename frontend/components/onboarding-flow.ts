'use client'

import { createElement, useState } from 'react'

import { GoalScreen } from './onboarding/goal-screen'
import { ProblemsScreen } from './onboarding/problems-screen'
import { UserTypeScreen } from './onboarding/user-type-screen'
import { useTheme } from '@/app/theme-provider'

interface OnboardingFlowProps {
  isOpen: boolean
  onComplete: (data: OnboardingData) => void
  onSkip: () => void
}

export interface OnboardingData {
  goal: string
  userType: string
  problems: string[]
}

type OnboardingStep = 'goal' | 'userType' | 'problems'

export function OnboardingFlow({ isOpen, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('goal')
  const [data, setData] = useState<Partial<OnboardingData>>({})
  const { theme } = useTheme()

  if (!isOpen) return null

  const handleGoalNext = (goal: string): void => {
    setData((prev) => ({ ...prev, goal }))
    setCurrentStep('userType')
  }

  const handleUserTypeNext = (userType: string): void => {
    setData((prev) => ({ ...prev, userType }))
    setCurrentStep('problems')
  }

  const handleProblemsNext = (problems: string[]): void => {
    onComplete({ goal: data.goal || '', userType: data.userType || '', problems })
  }

  const handleBack = (): void => {
    if (currentStep === 'userType') setCurrentStep('goal')
    else if (currentStep === 'problems') setCurrentStep('userType')
  }

  return createElement(
    'div',
    { className: 'fixed inset-0 z-50 overflow-y-auto' },
    currentStep === 'goal' ? createElement(GoalScreen, { theme, onNext: handleGoalNext, onSkip }) : null,
    currentStep === 'userType' ? createElement(UserTypeScreen, { theme, onNext: handleUserTypeNext, onBack: handleBack }) : null,
    currentStep === 'problems' ? createElement(ProblemsScreen, { theme, onNext: handleProblemsNext, onBack: handleBack }) : null,
  )
}
