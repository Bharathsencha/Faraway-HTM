'use client'

import { createElement } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTheme } from '@/app/theme-provider'

export function ProblemSolution() {
  const { theme } = useTheme()

  const textColor = theme === 'dark' ? '#f5f0e8' : '#241710'
  const subTextColor = theme === 'dark' ? '#d3c8bc' : '#6e6257'
  
  // Card backgrounds matching the existing features card design
  const cardBg = theme === 'dark' ? 'rgba(42, 32, 24, 0.68)' : 'rgba(255, 250, 244, 0.78)'
  const cardBorder = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(150, 111, 81, 0.16)'

  return createElement(
    'section',
    { id: 'problem-solution', className: 'relative px-4 py-24 border-t border-b', style: { borderColor: cardBorder } },
    createElement('div', { className: 'mx-auto max-w-6xl' },
      createElement('div', { className: 'mb-16 text-center' },
        createElement('h2', { className: 'mb-4 font-serif text-4xl sm:text-5xl', style: { color: textColor } }, 'The Problem & Our Solution'),
        createElement('p', { className: 'mx-auto max-w-2xl text-lg leading-8', style: { color: subTextColor } }, 'Why traditional prep doesn\'t work, and how Interview Arena changes the game.')
      ),
      createElement('div', { className: 'grid grid-cols-1 gap-8 md:grid-cols-2' },
        // The Problem Card
        createElement('div', { 
          className: 'group relative overflow-hidden rounded-[1.25rem] border-l-8 p-8 backdrop-blur-xl transition-all duration-300', 
          style: { 
            backgroundColor: cardBg, 
            borderColor: '#ff6a2a', // Thick orange left border
            borderTopColor: cardBorder,
            borderRightColor: cardBorder,
            borderBottomColor: cardBorder,
            borderTopWidth: '1px',
            borderRightWidth: '1px',
            borderBottomWidth: '1px',
            boxShadow: '0 18px 48px rgba(255, 106, 42, 0.04)'
          } 
        },
          createElement('div', { className: 'mb-4 flex items-center gap-3', style: { color: '#ff6a2a' } }, 
            createElement(AlertCircle, { size: 28 }),
            createElement('h3', { className: 'text-2xl font-bold', style: { color: textColor } }, 'The Problem')
          ),
          createElement('p', { className: 'text-base leading-relaxed sm:text-lg', style: { color: subTextColor } }, 
            'Interviews are stressful and competitive. Traditional mock interviews are monotonous, boring, and feel like exams rather than learning experiences. Candidates lose interest quickly, don\'t practice regularly, and fail to build real confidence or skills.'
          )
        ),
        // Our Solution Card
        createElement('div', { 
          className: 'group relative overflow-hidden rounded-[1.25rem] border-l-8 p-8 backdrop-blur-xl transition-all duration-300', 
          style: { 
            backgroundColor: cardBg, 
            borderColor: '#3b82f6', // Thick blue left border
            borderTopColor: cardBorder,
            borderRightColor: cardBorder,
            borderBottomColor: cardBorder,
            borderTopWidth: '1px',
            borderRightWidth: '1px',
            borderBottomWidth: '1px',
            boxShadow: '0 18px 48px rgba(59, 130, 246, 0.04)'
          } 
        },
          createElement('div', { className: 'mb-4 flex items-center gap-3', style: { color: '#3b82f6' } }, 
            createElement(CheckCircle2, { size: 28 }),
            createElement('h3', { className: 'text-2xl font-bold', style: { color: textColor } }, 'Our Solution')
          ),
          createElement('p', { className: 'text-base leading-relaxed sm:text-lg', style: { color: subTextColor } }, 
            'Interview Arena gamifies mock interview prep into an interactive learning journey. Users practice through short, engaging games teaching real skills—speaking clearly, thinking under pressure, negotiating salary, and handling tricky questions. Fast, fun, and adaptive gameplay makes users want to practice daily.'
          )
        )
      )
    )
  )
}
