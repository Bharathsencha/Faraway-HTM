'use client'

import { createElement, useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'

interface GoalScreenProps {
  theme: 'light' | 'dark'
  onNext: (goal: string) => void
  onSkip: () => void
}

function PaperPin() {
  return createElement(
    'svg',
    { width: 42, height: 42, viewBox: '0 0 42 42', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': 'true' },
    createElement('g', { filter: 'url(#shadow)' },
      createElement('path', {
        d: 'M24.8 6.4C28.2 6.4 31 9.2 31 12.6C31 14.7 30 16.6 28.4 17.8L26.8 19L30.8 25.2C31.4 26.1 31.1 27.3 30.2 27.9C29.3 28.5 28.1 28.2 27.5 27.3L23.5 21.1L21.7 22.3C20.8 22.9 19.6 22.8 18.9 22.1L13.8 17C13.1 16.3 13 15.1 13.6 14.2C14.2 13.3 15.4 13 16.3 13.6L20.4 16.3L21.8 15.4C21.1 14.2 20.7 12.9 20.7 11.5C20.7 8.1 23.4 6.4 24.8 6.4Z',
        fill: 'url(#pinBody)',
      }),
      createElement('ellipse', { cx: 25, cy: 12.2, rx: 5.8, ry: 5.2, fill: 'url(#pinHead)' }),
      createElement('path', { d: 'M14 19.1L7.3 31.2', stroke: 'url(#pinTail)', strokeWidth: 2.1, strokeLinecap: 'round' }),
      createElement('circle', { cx: 24.7, cy: 12, r: 1.8, fill: '#fff8f0', opacity: 0.95 })
    ),
    createElement('defs', null,
      createElement('filter', { id: 'shadow', x: 0, y: 0, width: 42, height: 42, filterUnits: 'userSpaceOnUse', colorInterpolationFilters: 'sRGB' },
        createElement('feFlood', { floodOpacity: 0, result: 'BackgroundImageFix' }),
        createElement('feColorMatrix', { in: 'SourceAlpha', values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0', result: 'hardAlpha' }),
        createElement('feOffset', { dy: 1.2 }),
        createElement('feGaussianBlur', { stdDeviation: 1.8 }),
        createElement('feComposite', { in2: 'hardAlpha', operator: 'out' }),
        createElement('feColorMatrix', { values: '0 0 0 0 0.24 0 0 0 0 0.12 0 0 0 0 0.08 0 0 0 0.22 0' }),
        createElement('feBlend', { mode: 'normal', in2: 'BackgroundImageFix', result: 'effect1_dropShadow' }),
        createElement('feBlend', { mode: 'normal', in: 'SourceGraphic', in2: 'effect1_dropShadow', result: 'shape' })
      ),
      createElement('linearGradient', { id: 'pinBody', x1: 13.2, y1: 6.4, x2: 30.8, y2: 28, gradientUnits: 'userSpaceOnUse' }, createElement('stop', { stopColor: '#ffb45b' }), createElement('stop', { offset: 1, stopColor: '#e85d18' })),
      createElement('linearGradient', { id: 'pinHead', x1: 19.2, y1: 6.8, x2: 30.8, y2: 17.4, gradientUnits: 'userSpaceOnUse' }, createElement('stop', { stopColor: '#ffcf7a' }), createElement('stop', { offset: 1, stopColor: '#ff7a18' })),
      createElement('linearGradient', { id: 'pinTail', x1: 14, y1: 19.1, x2: 7.3, y2: 31.2, gradientUnits: 'userSpaceOnUse' }, createElement('stop', { stopColor: '#b35419' }), createElement('stop', { offset: 1, stopColor: '#7f3a14' }))
    )
  )
}

export function GoalScreen({ theme, onNext, onSkip }: GoalScreenProps) {
  const [goal, setGoal] = useState<string>('')
  const [placeholderText, setPlaceholderText] = useState('')

  useEffect(() => {
    const examples = [
      "Software Engineer at Google...",
      "Product Manager at Stripe...",
      "UX Designer at Airbnb...",
      "Data Scientist at OpenAI..."
    ]
    let currentExample = 0
    let currentChar = 0
    let isDeleting = false
    let timer: NodeJS.Timeout

    const type = () => {
      const fullText = examples[currentExample]
      
      if (isDeleting) {
        setPlaceholderText(fullText.substring(0, currentChar - 1))
        currentChar--
      } else {
        setPlaceholderText(fullText.substring(0, currentChar + 1))
        currentChar++
      }

      let typeSpeed = isDeleting ? 25 : 60

      if (!isDeleting && currentChar === fullText.length) {
        typeSpeed = 2000
        isDeleting = true
      } else if (isDeleting && currentChar === 0) {
        isDeleting = false
        currentExample = (currentExample + 1) % examples.length
        typeSpeed = 400
      }

      timer = setTimeout(type, typeSpeed)
    }

    timer = setTimeout(type, 500)
    return () => clearTimeout(timer)
  }, [])

  const textColor = theme === 'dark' ? '#f5f0e8' : '#241710'
  const subTextColor = theme === 'dark' ? '#d3c8bc' : '#6e6257'
  const paperColor = theme === 'dark' ? '#f1e7d8' : '#fffaf2'
  const paperShadow = theme === 'dark' ? '0 24px 80px rgba(0, 0, 0, 0.42), 0 4px 18px rgba(0, 0, 0, 0.2)' : '0 24px 80px rgba(84, 49, 22, 0.18), 0 4px 18px rgba(84, 49, 22, 0.1)'
  const paperEdge = theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(95, 68, 46, 0.12)'
  const paperTextColor = '#241710'
  const paperLabelColor = '#7a6657'
  const accent = '#ff6a2a'

  const handleSubmit = (): void => {
    if (goal.trim()) onNext(goal)
  }

  return createElement(
    'div',
    {
      className: 'relative min-h-screen overflow-x-hidden',
      style: {
        background: theme === 'dark'
          ? 'radial-gradient(circle at top left, rgba(255, 106, 42, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(255, 210, 162, 0.12), transparent 24%), linear-gradient(180deg, #140f0b 0%, #1a1410 52%, #120d0a 100%)'
          : 'radial-gradient(circle at top left, rgba(255, 142, 82, 0.22), transparent 28%), radial-gradient(circle at top right, rgba(255, 206, 156, 0.35), transparent 24%), linear-gradient(180deg, #fffaf3 0%, #fff2e5 50%, #ffe2c8 100%)',
      },
    },
    createElement('div', { className: 'absolute inset-x-0 top-0 h-44 opacity-70', style: { background: theme === 'dark' ? 'linear-gradient(180deg, rgba(255, 135, 70, 0.22), transparent)' : 'linear-gradient(180deg, rgba(255, 163, 102, 0.28), transparent)' } }),
    createElement(
      'div',
      { className: 'relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pb-6 pt-4 sm:px-6' },
      createElement('div', { className: 'flex items-center justify-end' }, createElement('button', { onClick: onSkip, className: 'rounded-full px-4 py-2 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5', style: { color: accent, backgroundColor: theme === 'dark' ? 'rgba(255, 106, 42, 0.12)' : 'rgba(255, 106, 42, 0.1)' }, type: 'button' }, 'Skip')),
      createElement('div', { className: 'mt-5 flex-1' },
        createElement('div', { className: 'mb-6 text-center' },
          createElement('p', { className: 'mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.32em]', style: { color: subTextColor } }, 'Step 1 of 3'),
          createElement('h1', { className: 'font-serif text-[clamp(2.6rem,7vw,3.7rem)] leading-none tracking-[-0.03em]', style: { color: textColor } }, "What's Your Goal?"),
          createElement('p', { className: 'mx-auto mt-3 max-w-[24rem] text-sm leading-6', style: { color: subTextColor } }, "Tell us the role or company you are aiming for and we'll shape the flow around it.")
        ),
        createElement('div', { className: 'relative mx-auto max-w-[360px] rounded-[2rem] border px-4 pb-5 pt-7 sm:px-5', style: { backgroundColor: paperColor, borderColor: paperEdge, boxShadow: paperShadow, transform: 'rotate(-1.5deg)', backgroundImage: theme === 'dark' ? 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.05)), repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(135, 101, 74, 0.1) 28px)' : 'linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.25)), repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(145, 107, 77, 0.08) 28px)' } },
          createElement('div', { className: 'absolute left-4 top-[-18px] drop-shadow-[0_10px_12px_rgba(0,0,0,0.18)]' }, createElement(PaperPin, null)),
          createElement('div', { className: 'rounded-[1.5rem] border border-dashed px-4 py-4', style: { borderColor: theme === 'dark' ? 'rgba(64, 46, 35, 0.26)' : 'rgba(150, 111, 81, 0.22)' } },
            createElement('label', { className: 'mb-2 block text-xs font-semibold uppercase tracking-[0.28em]', style: { color: paperLabelColor } }, 'Your target'),
            createElement('style', null, `
              @keyframes popInChar {
                0% { opacity: 0; transform: scale(0.6) translateY(2px); }
                60% { transform: scale(1.15); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
              }
              .char-animate {
                display: inline-block;
                animation: popInChar 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              }
              .overlay-container {
                position: relative;
                width: 100%;
                min-height: 13rem;
              }
              .hide-text-input {
                color: transparent !important;
              }
              .hide-text-input::selection {
                color: ${paperTextColor} !important;
                background-color: rgba(255, 106, 42, 0.25) !important;
              }
            `),
            createElement('div', { className: 'overlay-container' },
              createElement('div', { 
                className: 'absolute inset-0 pointer-events-none text-[1.05rem] leading-7 p-0 m-0', 
                style: { color: paperTextColor, fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' } 
              },
                goal ? goal.split('').map((char, i) => 
                  (char === ' ' || char === '\\n') ? char : createElement('span', { key: i, className: 'char-animate' }, char)
                ) : createElement('span', { className: 'opacity-55' }, placeholderText)
              ),
              createElement('textarea', { 
                value: goal, 
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => { setGoal(e.target.value) }, 
                className: 'hide-text-input absolute inset-0 z-10 w-full h-full resize-none border-0 bg-transparent text-[1.05rem] leading-7 outline-none p-0 m-0', 
                style: { caretColor: accent, fontFamily: 'var(--font-sans)' } 
              })
            )
          ),
          createElement('div', { className: 'mt-4 flex items-center justify-between rounded-[1.2rem] px-3 py-2', style: { backgroundColor: theme === 'dark' ? 'rgba(39, 29, 22, 0.45)' : 'rgba(255, 255, 255, 0.55)' } },
            createElement('div', null,
              createElement('p', { className: 'text-[0.7rem] font-semibold uppercase tracking-[0.24em]', style: { color: paperLabelColor } }, 'Focused path'),
              createElement('p', { className: 'text-sm font-medium', style: { color: paperTextColor } }, 'Goal-setting made simple')
            ),
            createElement('div', { className: 'rounded-full px-3 py-1 text-xs font-semibold', style: { backgroundColor: theme === 'dark' ? 'rgba(255, 106, 42, 0.16)' : 'rgba(255, 106, 42, 0.14)', color: accent } }, 'Paper note')
          )
        ),
        createElement('div', { className: 'mx-auto mt-5 max-w-[360px]' }, createElement('button', { onClick: handleSubmit, disabled: !goal.trim(), className: 'group w-full rounded-[1.4rem] px-5 py-4 text-base font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60', style: { background: goal.trim() ? 'linear-gradient(135deg, #ff7a2f 0%, #ff4f00 100%)' : theme === 'dark' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.78)', color: goal.trim() ? '#fffaf5' : textColor, boxShadow: goal.trim() ? '0 18px 36px rgba(255, 79, 0, 0.28)' : '0 10px 24px rgba(0, 0, 0, 0.12)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255, 255, 255, 0.5)' }, type: 'button' }, createElement('span', { className: 'flex items-center justify-center gap-2' }, 'Next', createElement(ChevronRight, { size: 20, className: 'transition-transform duration-200 group-hover:translate-x-0.5' })))),
        createElement('div', { className: 'mx-auto mt-6 max-w-[360px] rounded-[1.5rem] border px-4 py-4', style: { borderColor: paperEdge, backgroundColor: theme === 'dark' ? 'rgba(34, 25, 18, 0.55)' : 'rgba(255, 250, 244, 0.82)', boxShadow: '0 16px 48px rgba(0,0,0,0.08)' } }, createElement('p', { className: 'text-sm font-medium', style: { color: subTextColor } }, 'A clear goal helps us tailor the next steps, whether you are preparing for interviews or switching roles.')),
      )
    )
  )
}
