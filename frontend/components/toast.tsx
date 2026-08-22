'use client'

import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastEntry {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }

  const pushToast = (input: ToastInput) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const toast: ToastEntry = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant || 'info',
    }

    setToasts((current) => [toast, ...current].slice(0, 4))

    const timer = setTimeout(() => removeToast(id), input.duration || 3200)
    timersRef.current.set(id, timer)
  }

  const iconByVariant: Record<ToastVariant, typeof CheckCircle2> = {
    success: CheckCircle2,
    error: AlertTriangle,
    info: Info,
  }

  const colorsByVariant: Record<ToastVariant, { border: string; background: string; text: string; accent: string }> = {
    success: {
      border: 'rgba(34, 197, 94, 0.25)',
      background: 'rgba(34, 197, 94, 0.08)',
      text: 'var(--foreground)',
      accent: '#22c55e',
    },
    error: {
      border: 'rgba(220, 38, 38, 0.25)',
      background: 'rgba(220, 38, 38, 0.08)',
      text: 'var(--foreground)',
      accent: '#dc2626',
    },
    info: {
      border: 'rgba(255, 79, 0, 0.25)',
      background: 'rgba(255, 79, 0, 0.08)',
      text: 'var(--foreground)',
      accent: '#ff4f00',
    },
  }

  return createElement(
    ToastContext.Provider,
    { value: { toast: pushToast } },
    children,
    createElement(
      'div',
      { className: 'pointer-events-none fixed right-4 top-4 z-[9999] flex w-full max-w-sm flex-col gap-3 p-2 sm:right-6 sm:top-6' },
      ...toasts.map((toast) => {
        const Icon = iconByVariant[toast.variant]
        const colors = colorsByVariant[toast.variant]

        return createElement(
          'div',
          {
            key: toast.id,
            className: 'pointer-events-auto animate-slide-up rounded-[1rem] border p-4 shadow-xl backdrop-blur-xl',
            style: {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          },
          createElement('div', { className: 'flex items-start gap-3' },
            createElement('div', { className: 'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', style: { backgroundColor: colors.accent, color: '#fffefb' } },
              createElement(Icon, { size: 18 })
            ),
            createElement('div', { className: 'min-w-0 flex-1' },
              createElement('p', { className: 'text-sm font-semibold' }, toast.title),
              toast.description ? createElement('p', { className: 'mt-1 text-sm', style: { color: 'var(--muted-foreground)' } }, toast.description) : null
            ),
            createElement('button', {
              type: 'button',
              onClick: () => removeToast(toast.id),
              className: 'mt-0.5 rounded-full p-1 transition-colors hover:bg-black/5',
              style: { color: 'var(--muted-foreground)' },
              'aria-label': 'Dismiss notification',
            }, createElement(X, { size: 16 }))
          )
        )
      })
    )
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    return { toast: (_input: ToastInput) => {} }
  }
  return context
}
