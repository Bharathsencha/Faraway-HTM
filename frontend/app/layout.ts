import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { createElement, type ReactElement, type ReactNode } from 'react'

import { ThemeProvider } from './theme-provider'
import { ToastProvider } from '@/components/toast'
import { ServiceWorkerCleanup } from '@/components/sw-cleanup'
import './globals.css'

export const metadata: Metadata = {
  title: 'Interview Arena | Gamified AI-Powered Interview Prep',
  description: 'Master interviews without the burnout. Interview Arena uses AI agents and gamification to keep you interview-ready while having fun.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>): ReactElement {
  return createElement(
    'html',
    { lang: 'en', className: 'dark bg-canvas' },
    createElement(
      'body',
      { className: 'font-sans antialiased text-ink' },
      createElement(ThemeProvider, null,
        createElement(ToastProvider, null, children),
        createElement(ServiceWorkerCleanup, null),
      ),
      process.env.NODE_ENV === 'production' ? createElement(Analytics) : null,
    ),
  )
}
