'use client'

import { createElement, useState } from 'react'
import { BookOpen, BriefcaseBusiness, ChevronRight, GraduationCap } from 'lucide-react'

interface UserTypeScreenProps {
  theme: 'light' | 'dark'
  onNext: (userType: string) => void
  onBack: () => void
}

type UserType = 'fresher' | 'student' | 'professional' | ''

interface Option {
  id: UserType
  label: string
  description: string
  icon: typeof GraduationCap
}

export function UserTypeScreen({ theme, onNext, onBack }: UserTypeScreenProps) {
  const [selectedType, setSelectedType] = useState<UserType>('')

  const background = theme === 'dark'
    ? 'radial-gradient(circle at top left, rgba(255, 106, 42, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(255, 210, 162, 0.12), transparent 24%), linear-gradient(180deg, #140f0b 0%, #1a1410 52%, #120d0a 100%)'
    : 'radial-gradient(circle at top left, rgba(255, 142, 82, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(255, 206, 156, 0.35), transparent 24%), linear-gradient(180deg, #fffaf3 0%, #fff2e5 50%, #ffe2c8 100%)'
  const topGlow = theme === 'dark' ? 'linear-gradient(180deg, rgba(255, 135, 70, 0.22), transparent)' : 'linear-gradient(180deg, rgba(255, 163, 102, 0.28), transparent)'
  const textColor = theme === 'dark' ? '#f5f0e8' : '#241710'
  const cardBgColor = theme === 'dark' ? 'rgba(42, 32, 24, 0.72)' : 'rgba(255, 250, 244, 0.9)'
  const cardBorderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(150, 111, 81, 0.2)'
  const labelColor = theme === 'dark' ? '#d3c8bc' : '#6e6257'

  const options: Option[] = [
    { id: 'fresher', label: 'Fresher', description: 'Just graduated or about to graduate', icon: GraduationCap },
    { id: 'student', label: 'Student Looking for Internship', description: 'Currently studying, seeking internship opportunities', icon: BookOpen },
    { id: 'professional', label: 'Professional', description: 'Working professional looking to switch or advance', icon: BriefcaseBusiness },
  ]

  const handleNext = (): void => {
    if (selectedType) onNext(selectedType)
  }

  return createElement(
    'div',
    { className: 'relative min-h-screen overflow-x-hidden', style: { background } },
    createElement('div', { className: 'absolute inset-x-0 top-0 h-44 opacity-70', style: { background: topGlow } }),
    createElement('div', { className: 'relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pb-6 pt-4 sm:px-6' },
      createElement('div', { className: 'flex items-center justify-between' },
        createElement('button', { onClick: onBack, className: 'rounded-full px-4 py-2 text-sm font-semibold transition-colors', style: { color: labelColor, backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.58)' }, type: 'button' }, 'Back'),
        createElement('span', { className: 'text-xs font-semibold uppercase tracking-[0.24em]', style: { color: labelColor } }, 'Step 2 of 3')
      ),
      createElement('div', { className: 'mt-8 flex-1' },
        createElement('div', { className: 'mb-7 text-center' },
          createElement('h1', { className: 'font-serif text-[clamp(2.5rem,7vw,3.6rem)] leading-none', style: { color: textColor } }, 'Who Are You?'),
          createElement('p', { className: 'mx-auto mt-3 max-w-[24rem] text-sm leading-6', style: { color: labelColor } }, 'Help us understand your background')
        ),
        createElement('div', { className: 'space-y-4' },
          ...options.map((option) => {
            const Icon = option.icon
            const isSelected = selectedType === option.id

            return createElement('button', { key: option.id, onClick: () => { setSelectedType(option.id) }, className: 'w-full rounded-2xl border-2 p-5 text-left transition-all', style: { backgroundColor: isSelected ? '#ff4f0015' : cardBgColor, borderColor: isSelected ? '#ff4f00' : cardBorderColor, cursor: 'pointer', boxShadow: isSelected ? '0 16px 34px rgba(255, 79, 0, 0.16)' : '0 12px 30px rgba(0, 0, 0, 0.08)' }, type: 'button' },
              createElement('div', { className: 'flex items-start gap-4' },
                createElement('span', { className: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full', style: { backgroundColor: isSelected ? '#ff4f00' : theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 106, 42, 0.1)', color: isSelected ? '#fffaf5' : '#ff6a2a' } }, createElement(Icon, { size: 22 })),
                createElement('div', { className: 'flex-1' },
                  createElement('h3', { className: 'text-lg font-semibold', style: { color: textColor } }, option.label),
                  createElement('p', { className: 'mt-1 text-sm leading-5', style: { color: labelColor } }, option.description)
                ),
                isSelected ? createElement('div', { className: 'mt-1 h-5 w-5 rounded-full', style: { backgroundColor: '#ff4f00' } }) : null
              )
            )
          })
        ),
        createElement('div', { className: 'mt-6' },
          createElement('button', { onClick: handleNext, disabled: !selectedType, className: 'flex w-full items-center justify-center gap-2 rounded-[1.4rem] px-5 py-4 text-base font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60', style: { background: selectedType ? 'linear-gradient(135deg, #ff7a2f 0%, #ff4f00 100%)' : theme === 'dark' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.78)', color: selectedType ? '#fffaf5' : textColor, boxShadow: selectedType ? '0 18px 36px rgba(255, 79, 0, 0.28)' : '0 10px 24px rgba(0, 0, 0, 0.12)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255, 255, 255, 0.5)' }, type: 'button' }, 'Next', createElement(ChevronRight, { size: 20 }))
        )
      )
    )
  )
}
