'use client'

import { createElement } from 'react'
import { BarChart3, Bot, Gamepad2, Target, Trophy, Zap } from 'lucide-react'

import { useTheme } from '@/app/theme-provider'

export function Features() {
  const { theme } = useTheme()

  const features = [
    { icon: Bot, title: 'Multi-Agent AI System', description: 'Practice with AI personas that simulate real interviewer behaviors and question styles.' },
    { icon: Gamepad2, title: 'Gamified Learning', description: 'Earn points, unlock achievements, and build consistency through focused challenges.' },
    { icon: Zap, title: 'Adaptive Difficulty', description: 'The system learns your weak areas and adjusts the challenge without overwhelming you.' },
    { icon: BarChart3, title: 'Real-Time Feedback', description: 'Get instant AI-powered feedback on your answers, structure, and communication.' },
    { icon: Target, title: 'Role-Specific Prep', description: 'Customize your interview prep for software engineering, product, design, and more.' },
    { icon: Trophy, title: 'Progress Tracking', description: 'Visualize improvement with performance metrics across interview categories.' },
  ]

  const textColor = theme === 'dark' ? '#f5f0e8' : '#241710'
  const subTextColor = theme === 'dark' ? '#d3c8bc' : '#6e6257'
  const cardBg = theme === 'dark' ? 'rgba(42, 32, 24, 0.68)' : 'rgba(255, 250, 244, 0.78)'
  const cardBorder = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(150, 111, 81, 0.16)'

  return createElement(
    'section',
    { id: 'features', className: 'relative px-4 py-24' },
    createElement('div', { className: 'mx-auto max-w-6xl' },
      createElement('div', { className: 'mb-20 text-center' },
        createElement('h2', { className: 'mb-6 font-serif text-4xl sm:text-5xl', style: { color: textColor } }, 'Designed for Success'),
        createElement('p', { className: 'mx-auto max-w-2xl text-lg leading-8', style: { color: subTextColor } }, 'Interview Arena combines focused AI coaching with game psychology to create a calm, repeatable prep routine.')
      ),
      createElement('div', { className: 'grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3' },
        ...features.map((feature) =>
          createElement('div', { key: feature.title, className: 'group relative overflow-hidden rounded-[1.25rem] border p-8 backdrop-blur-xl transition-all duration-300', style: { backgroundColor: cardBg, borderColor: cardBorder, boxShadow: '0 18px 48px rgba(0, 0, 0, 0.08)' } },
            createElement('div', { className: 'mb-4', style: { color: '#ff4f00' } }, createElement(feature.icon, { size: 32 })),
            createElement('h3', { className: 'mb-3 text-xl font-semibold', style: { color: textColor } }, feature.title),
            createElement('p', { className: 'leading-relaxed', style: { color: subTextColor } }, feature.description)
          )
        )
      )
    )
  )
}
