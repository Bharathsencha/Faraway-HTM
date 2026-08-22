'use client'

import { createElement, useState } from 'react'
import { Brain, Building2, ChevronRight, Code2, Coins, MessageCircle, Send, SmilePlus, Zap } from 'lucide-react'

interface ProblemsScreenProps {
  theme: 'light' | 'dark'
  onNext: (problems: string[]) => void
  onBack: () => void
}

interface Problem {
  id: string
  label: string
  icon: typeof MessageCircle
}

export function ProblemsScreen({ theme, onNext, onBack }: ProblemsScreenProps) {
  const [selectedProblems, setSelectedProblems] = useState<string[]>([])

  const background = theme === 'dark'
    ? 'radial-gradient(circle at top left, rgba(255, 106, 42, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(255, 210, 162, 0.12), transparent 24%), linear-gradient(180deg, #140f0b 0%, #1a1410 52%, #120d0a 100%)'
    : 'radial-gradient(circle at top left, rgba(255, 142, 82, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(255, 206, 156, 0.35), transparent 24%), linear-gradient(180deg, #fffaf3 0%, #fff2e5 50%, #ffe2c8 100%)'
  const topGlow = theme === 'dark' ? 'linear-gradient(180deg, rgba(255, 135, 70, 0.22), transparent)' : 'linear-gradient(180deg, rgba(255, 163, 102, 0.28), transparent)'
  const textColor = theme === 'dark' ? '#f5f0e8' : '#241710'
  const cardBgColor = theme === 'dark' ? 'rgba(42, 32, 24, 0.72)' : 'rgba(255, 250, 244, 0.9)'
  const cardBorderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(150, 111, 81, 0.2)'
  const labelColor = theme === 'dark' ? '#d3c8bc' : '#6e6257'

  const problems: Problem[] = [
    { id: 'communication', label: 'Communication Skills', icon: MessageCircle },
    { id: 'technical', label: 'Technical Knowledge', icon: Code2 },
    { id: 'confidence', label: 'Lack of Confidence', icon: SmilePlus },
    { id: 'nervousness', label: 'Nervousness During Interviews', icon: Zap },
    { id: 'behavioral', label: 'Behavioral Questions', icon: Brain },
    { id: 'negotiation', label: 'Salary Negotiation', icon: Coins },
    { id: 'research', label: 'Company Research', icon: Building2 },
    { id: 'follow-up', label: 'Follow-up Strategy', icon: Send },
  ]

  const toggleProblem = (problemId: string): void => {
    setSelectedProblems((prev) => (prev.includes(problemId) ? prev.filter((id) => id !== problemId) : [...prev, problemId]))
  }

  const handleNext = (): void => {
    onNext(selectedProblems)
  }

  return createElement(
    'div',
    { className: 'relative min-h-screen overflow-x-hidden', style: { background } },
    createElement('div', { className: 'absolute inset-x-0 top-0 h-44 opacity-70', style: { background: topGlow } }),
    createElement('div', { className: 'relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pb-6 pt-4 sm:px-6' },
      createElement('div', { className: 'flex items-center justify-between' },
        createElement('button', { onClick: onBack, className: 'rounded-full px-4 py-2 text-sm font-semibold transition-colors', style: { color: labelColor, backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.58)' }, type: 'button' }, 'Back'),
        createElement('span', { className: 'text-xs font-semibold uppercase tracking-[0.24em]', style: { color: labelColor } }, 'Step 3 of 3')
      ),
      createElement('div', { className: 'mt-8 flex-1' },
        createElement('div', { className: 'mb-7 text-center' },
          createElement('h1', { className: 'font-serif text-[clamp(2.35rem,7vw,3.35rem)] leading-none', style: { color: textColor } }, 'What Problems Are You Facing?'),
          createElement('p', { className: 'mx-auto mt-3 max-w-[24rem] text-sm leading-6', style: { color: labelColor } }, 'Select any areas you want to improve')
        ),
        createElement('div', { className: 'grid grid-cols-2 gap-3' },
          ...problems.map((problem) => {
            const Icon = problem.icon
            const isSelected = selectedProblems.includes(problem.id)

            return createElement('button', { key: problem.id, onClick: () => { toggleProblem(problem.id) }, className: 'rounded-xl border-2 p-4 text-center transition-all', style: { backgroundColor: isSelected ? '#ff4f0015' : cardBgColor, borderColor: isSelected ? '#ff4f00' : cardBorderColor, cursor: 'pointer', boxShadow: isSelected ? '0 14px 28px rgba(255, 79, 0, 0.16)' : '0 10px 24px rgba(0, 0, 0, 0.08)' }, type: 'button' },
              createElement('span', { className: 'mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full', style: { backgroundColor: isSelected ? '#ff4f00' : theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 106, 42, 0.1)', color: isSelected ? '#fffaf5' : '#ff6a2a' } }, createElement(Icon, { size: 20 })),
              createElement('p', { className: 'text-sm font-medium leading-5', style: { color: textColor } }, problem.label)
            )
          })
        ),
        createElement('p', { className: 'mt-4 text-center text-xs', style: { color: labelColor } }, `Selected: ${selectedProblems.length}`),
        createElement('div', { className: 'mt-5' },
          createElement('button', { onClick: handleNext, className: 'flex w-full items-center justify-center gap-2 rounded-[1.4rem] px-5 py-4 text-base font-semibold transition-all duration-200', style: { background: 'linear-gradient(135deg, #ff7a2f 0%, #ff4f00 100%)', color: '#fffaf5', boxShadow: '0 18px 36px rgba(255, 79, 0, 0.28)', border: '1px solid rgba(255, 255, 255, 0.12)' }, type: 'button' }, 'Next', createElement(ChevronRight, { size: 20 }))
        )
      )
    )
  )
}
