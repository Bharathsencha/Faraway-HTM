'use client'

import { createElement } from 'react'

import { useTheme } from '@/app/theme-provider'

export function HowItWorks() {
  const { theme } = useTheme()

  const steps = [
    { number: '01', title: 'Choose Your Path', description: 'Select your interview role and experience level to get personalized preparation.' },
    { number: '02', title: 'Face AI Interviews', description: 'Practice with AI agents that challenge you with realistic interview scenarios.' },
    { number: '03', title: 'Get Instant Feedback', description: 'Receive detailed AI-powered analysis of your performance and areas to improve.' },
    { number: '04', title: 'Level Up', description: 'Earn rewards, unlock achievements, and progress through sharper interview rounds.' },
  ]

  const textColor = theme === 'dark' ? '#f5f0e8' : '#241710'
  const subTextColor = theme === 'dark' ? '#d3c8bc' : '#6e6257'
  const cardBg = theme === 'dark' ? 'rgba(42, 32, 24, 0.68)' : 'rgba(255, 250, 244, 0.76)'
  const cardBorder = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(150, 111, 81, 0.16)'

  return createElement(
    'section',
    { id: 'how-it-works', className: 'relative overflow-x-hidden px-4 py-24' },
    createElement('div', { className: 'mx-auto max-w-6xl' },
      createElement('div', { className: 'mb-20 text-center' },
        createElement('h2', { className: 'mb-6 font-serif text-4xl sm:text-5xl', style: { color: textColor } }, 'How Interview Arena Works'),
        createElement('p', { className: 'mx-auto max-w-2xl text-lg leading-8', style: { color: subTextColor } }, 'A streamlined approach to interview preparation that keeps you engaged without burning you out.')
      ),
      createElement('div', { className: 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4' },
        ...steps.map((step, index) =>
          createElement('div', { key: step.number, className: 'relative' },
            index < steps.length - 1 ? createElement('div', { className: 'absolute left-full top-24 hidden h-px w-6 lg:block', style: { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(150, 111, 81, 0.24)' } }) : null,
            createElement('div', { className: 'relative h-full rounded-[1.25rem] border p-8 backdrop-blur-xl', style: { backgroundColor: cardBg, borderColor: cardBorder, boxShadow: '0 18px 48px rgba(0, 0, 0, 0.08)' } },
              createElement('div', { className: 'mb-4 text-4xl font-semibold', style: { color: '#ff6a2a' } }, step.number),
              createElement('h3', { className: 'mb-3 text-xl font-semibold', style: { color: textColor } }, step.title),
              createElement('p', { className: 'leading-relaxed', style: { color: subTextColor } }, step.description)
            )
          )
        )
      )
    )
  )
}
