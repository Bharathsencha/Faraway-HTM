'use client'

import { createElement, type ReactElement } from 'react'

import { useTheme } from '@/app/theme-provider'

type StatItem = {
  value: string
  label: string
}

export function Stats(): ReactElement {
  const { theme } = useTheme()

  const stats: StatItem[] = [
    { value: '10K+', label: 'Active Learners' },
    { value: '2.5M+', label: 'Questions Practiced' },
    { value: '94%', label: 'Success Rate' },
    { value: '24/7', label: 'AI Available' },
  ]

  return createElement(
    'section',
    { className: 'px-4 py-20' },
    createElement('div', { className: 'mx-auto max-w-6xl rounded-[1.75rem] border px-6 py-10 backdrop-blur-xl', style: { backgroundColor: theme === 'dark' ? 'rgba(42, 32, 24, 0.6)' : 'rgba(255, 250, 244, 0.72)', borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(150, 111, 81, 0.16)', boxShadow: '0 18px 60px rgba(0, 0, 0, 0.08)' } },
      createElement('div', { className: 'grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12' },
        stats.map((stat) =>
          createElement('div', { key: stat.label, className: 'text-center' },
            createElement('div', { className: 'mb-2 text-4xl font-bold md:text-5xl', style: { color: '#ff4f00' } }, stat.value),
            createElement('div', { className: 'text-sm font-medium md:text-base', style: { color: theme === 'dark' ? '#d3c8bc' : '#6e6257' } }, stat.label)
          )
        )
      )
    )
  )
}
