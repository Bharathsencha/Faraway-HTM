'use client'

import { createElement } from 'react'
import { CheckCircle2, Rocket, Sparkles } from 'lucide-react'

import { useTheme } from '@/app/theme-provider'

function HeroNote({ theme }: { theme: 'light' | 'dark' }) {
  const paperColor = theme === 'dark' ? '#f1e7d8' : '#fffaf2'
  const paperEdge = theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(95, 68, 46, 0.12)'
  const paperShadow = theme === 'dark'
    ? '0 28px 90px rgba(0, 0, 0, 0.48), 0 8px 24px rgba(0, 0, 0, 0.24)'
    : '0 28px 90px rgba(119, 70, 31, 0.2), 0 8px 24px rgba(119, 70, 31, 0.1)'

  return createElement(
    'div',
    { className: 'relative mx-auto mt-14 w-full max-w-[420px] rounded-[2rem] border px-5 pb-5 pt-8 sm:max-w-[460px] sm:px-6 animate-note-float', style: { backgroundColor: paperColor, borderColor: paperEdge, boxShadow: paperShadow, backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.18)), repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(145, 107, 77, 0.08) 28px)' } },
    createElement('div', { className: 'absolute left-7 top-[-15px] h-8 w-8 rounded-full', style: { background: 'linear-gradient(135deg, #ffcf7a 0%, #ff7a18 100%)', boxShadow: '0 8px 14px rgba(166, 76, 18, 0.25)' } }),
    createElement('div', { className: 'rounded-[1.5rem] border border-dashed px-5 py-5', style: { borderColor: 'rgba(150, 111, 81, 0.24)' } },
      createElement('p', { className: 'mb-4 text-xs font-semibold uppercase tracking-[0.28em]', style: { color: '#7a6657' } }, 'Your prep path'),
      createElement('div', { className: 'space-y-4' },
        ['Role-specific mock rounds', 'Instant AI feedback', 'Confidence tracking'].map((item) =>
          createElement('div', { key: item, className: 'flex items-center gap-3 rounded-2xl px-3 py-3', style: { backgroundColor: 'rgba(255, 255, 255, 0.58)' } },
            createElement(CheckCircle2, { size: 19, color: '#ff6a2a' }),
            createElement('span', { className: 'text-sm font-medium', style: { color: '#241710' } }, item)
          )
        )
      )
    ),
    createElement('div', { className: 'mt-4 flex items-center justify-between rounded-[1.2rem] px-4 py-3', style: { backgroundColor: 'rgba(255, 255, 255, 0.58)' } },
      createElement('div', null,
        createElement('p', { className: 'text-[0.7rem] font-semibold uppercase tracking-[0.24em]', style: { color: '#7a6657' } }, 'Interview Arena'),
        createElement('p', { className: 'text-sm font-medium', style: { color: '#241710' } }, 'Practice without burnout')
      ),
      createElement('span', { className: 'rounded-full px-3 py-1 text-xs font-semibold', style: { backgroundColor: 'rgba(255, 106, 42, 0.14)', color: '#ff4f00' } }, 'AI coach')
    )
  )
}

export function Hero({ onStartClick }: { onStartClick?: () => void }) {
  const { theme } = useTheme()

  const textColor = theme === 'dark' ? '#f5f0e8' : '#241710'
  const subTextColor = theme === 'dark' ? '#d3c8bc' : '#6e6257'
  const pillBg = theme === 'dark' ? 'rgba(255, 106, 42, 0.12)' : 'rgba(255, 106, 42, 0.1)'
  const secondaryBg = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 250, 244, 0.78)'

  return createElement(
    'section',
    { className: 'relative flex min-h-screen items-center justify-center overflow-x-hidden px-4 pb-24 pt-28 transition-colors sm:px-6' },
    createElement('div', { className: 'absolute inset-x-0 top-0 h-56 opacity-80', style: { background: theme === 'dark' ? 'linear-gradient(180deg, rgba(255, 135, 70, 0.22), transparent)' : 'linear-gradient(180deg, rgba(255, 163, 102, 0.28), transparent)' } }),
    createElement('div', { className: 'relative z-10 mx-auto w-full max-w-5xl text-center' },
      createElement('div', { className: 'mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2', style: { backgroundColor: pillBg, color: '#ff6a2a' } },
        createElement(Sparkles, { size: 16 }),
        createElement('span', { className: 'text-sm font-semibold' }, 'AI-Powered Interview Mastery')
      ),
      createElement('h1', { className: 'mx-auto mb-6 max-w-4xl font-serif text-[clamp(3.2rem,8vw,6.4rem)] leading-none', style: { color: textColor } }, 'Play Games. Get Hired.'),
      createElement('p', { className: 'mx-auto mb-10 max-w-2xl text-base leading-7 sm:text-lg', style: { color: subTextColor } }, 'Interview Arena offers curated games that will help to crack your dream company. Experience a guided, game-like prep routine with AI mock interviews, role-specific feedback, and progress you can actually see.'),
      createElement('div', { className: 'flex flex-col justify-center gap-4 sm:flex-row' },
        createElement('button', { onClick: onStartClick, className: 'rounded-[1.2rem] px-8 py-4 text-base font-semibold transition-colors', style: { background: 'linear-gradient(135deg, #ff7a2f 0%, #ff4f00 100%)', color: '#fffaf5', boxShadow: '0 18px 36px rgba(255, 79, 0, 0.28)' }, type: 'button' }, 'Start'),
        createElement('button', { className: 'rounded-[1.2rem] border px-8 py-4 text-base font-semibold transition-colors', style: { backgroundColor: secondaryBg, borderColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(150, 111, 81, 0.18)', color: textColor }, type: 'button' }, 'Watch Demo')
      ),
      createElement(HeroNote, { theme }),
      createElement('div', { className: 'mt-10 flex flex-wrap items-center justify-center gap-4 text-sm', style: { color: subTextColor } },
        createElement('div', { className: 'flex items-center gap-2' }, createElement(Sparkles, { size: 16, color: '#ff6a2a' }), createElement('span', null, 'No credit card required')),
        createElement('div', { className: 'flex items-center gap-2' }, createElement(Rocket, { size: 16, color: '#ff6a2a' }), createElement('span', null, 'Get started in seconds'))
      )
    )
  )
}
