'use client'

import { createElement } from 'react'
import { Gift } from 'lucide-react'

import { useTheme } from '@/app/theme-provider'

export function CTA({ onStartClick }: { onStartClick?: () => void }) {
  const { theme } = useTheme()

  return createElement(
    'section',
    { className: 'px-4 py-24' },
    createElement('div', { className: 'mx-auto max-w-4xl' },
      createElement('div', { className: 'relative overflow-hidden rounded-[1.75rem] border p-12 text-center backdrop-blur-xl md:p-16', style: { backgroundColor: theme === 'dark' ? 'rgba(20, 15, 11, 0.72)' : 'rgba(36, 23, 16, 0.9)', borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.16)', boxShadow: '0 28px 90px rgba(0, 0, 0, 0.18)' } },
        createElement('h2', { className: 'mb-6 font-serif text-4xl sm:text-5xl', style: { color: '#fffaf5' } }, 'Ready to Ace Your Interview?'),
        createElement('p', { className: 'mx-auto mb-10 max-w-2xl text-lg leading-8', style: { color: '#d3c8bc' } }, 'Join candidates who have turned interview preparation into a focused daily routine.'),
        createElement('div', { className: 'flex flex-col justify-center gap-4 sm:flex-row' },
          createElement('button', { onClick: onStartClick, className: 'rounded-[12px] px-8 py-4 text-lg font-semibold transition-colors', style: { backgroundColor: '#ff4f00', color: '#fffefb' }, type: 'button' }, 'Get Started Free'),
          createElement('button', { className: 'rounded-[12px] border px-8 py-4 text-lg font-semibold transition-colors', style: { borderColor: 'rgba(255, 106, 42, 0.5)', color: '#ff8b4a', backgroundColor: 'rgba(255, 255, 255, 0.06)' }, type: 'button' }, 'Schedule Demo')
        ),
        createElement('div', { className: 'mt-8 flex items-center justify-center gap-2 text-base', style: { color: '#d3c8bc' } }, createElement(Gift, { size: 18, color: '#ff8b4a' }), createElement('span', null, 'First 7 days free. No credit card required.'))
      )
    )
  )
}
