'use client'

import { createElement, useState } from 'react'
import { X } from 'lucide-react'

import { authRequest, type AuthResponse } from '@/lib/auth'
import { useToast } from '@/components/toast'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  theme: 'light' | 'dark'
  onAuthSuccess?: (userData: AuthResponse['user']) => void | Promise<void>
}

export function AuthModal({ isOpen, onClose, theme, onAuthSuccess }: AuthModalProps) {
  const { toast } = useToast()
  const [isSignUp, setIsSignUp] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  if (!isOpen) return null

  const bgColor = theme === 'dark' ? '#1a1a1a' : '#fffefb'
  const textColor = theme === 'dark' ? '#f5f5f0' : '#201515'
  const inputBgColor = theme === 'dark' ? '#2a2a2a' : '#f8f4f0'
  const inputBorderColor = theme === 'dark' ? '#6a6a60' : '#c5c0b1'
  const labelColor = theme === 'dark' ? '#d0d0c5' : '#605d52'

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login'
      const payload = isSignUp
        ? { email, password, name: fullName }
        : { email, password }

      const result = await authRequest<AuthResponse>(endpoint, payload)

      try {
        localStorage.setItem('authToken', result.access_token)
        localStorage.setItem('authUser', JSON.stringify(result.user))
      } catch (storageError) {
        console.error('Failed to persist auth state:', storageError)
      }

      if (onAuthSuccess) {
        onAuthSuccess(result.user)
      }
      toast({
        title: isSignUp ? 'Account created' : 'Signed in',
        description: `${result.user.name} is now connected to the backend.`,
        variant: 'success',
      })
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed'
      setErrorMessage(message)
      toast({
        title: 'Authentication failed',
        description: message,
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldStyle = {
    backgroundColor: inputBgColor,
    borderColor: inputBorderColor,
    color: textColor,
    '--tw-ring-color': '#ff4f00',
  }

  return createElement(
    'div',
    { className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50', onClick: onClose },
    createElement(
      'div',
      { className: 'relative w-full max-w-md rounded-[16px] p-8 shadow-2xl', style: { backgroundColor: bgColor }, onClick: (e) => { e.stopPropagation() } },
      createElement('button', { onClick: onClose, className: 'absolute right-4 top-4 p-2 transition-colors', style: { color: theme === 'dark' ? '#a0a090' : '#605d52' }, type: 'button', 'aria-label': 'Close modal' }, createElement(X, { size: 24 })),
      createElement('h2', { className: 'mb-6 text-2xl font-semibold', style: { color: textColor } }, isSignUp ? 'Create Account' : 'Sign In'),
      createElement(
        'form',
        { onSubmit: handleSubmit, className: 'space-y-4' },
        isSignUp
          ? createElement('div', null,
            createElement('label', { className: 'mb-2 block text-sm font-medium', style: { color: labelColor } }, 'Full Name'),
            createElement('input', { type: 'text', value: fullName, onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setFullName(e.target.value) }, placeholder: 'John Doe', className: 'w-full rounded-[8px] border-2 px-4 py-3 transition-colors focus:outline-none focus:ring-2', style: fieldStyle })
          )
          : null,
        createElement('div', null,
          createElement('label', { className: 'mb-2 block text-sm font-medium', style: { color: labelColor } }, 'Email Address'),
          createElement('input', { type: 'email', value: email, onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setEmail(e.target.value) }, placeholder: 'you@example.com', required: true, className: 'w-full rounded-[8px] border-2 px-4 py-3 transition-colors focus:outline-none focus:ring-2', style: fieldStyle })
        ),
        createElement('div', null,
          createElement('label', { className: 'mb-2 block text-sm font-medium', style: { color: labelColor } }, 'Password'),
          createElement('input', { type: 'password', value: password, onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value) }, placeholder: '••••••••', required: true, className: 'w-full rounded-[8px] border-2 px-4 py-3 transition-colors focus:outline-none focus:ring-2', style: fieldStyle })
        ),
        errorMessage
          ? createElement('p', { className: 'text-sm font-medium text-red-500' }, errorMessage)
          : null,
        createElement('button', { type: 'submit', disabled: isSubmitting, className: 'mt-6 w-full rounded-[12px] py-3 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70', style: { backgroundColor: '#ff4f00' }, onMouseEnter: (e) => { if (!isSubmitting) e.currentTarget.style.backgroundColor = '#e64500' }, onMouseLeave: (e) => { e.currentTarget.style.backgroundColor = '#ff4f00' } }, isSubmitting ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In'))
      ),
      createElement('div', { className: 'mt-6 text-center text-sm', style: { color: labelColor } },
        isSignUp ? 'Already have an account?' : "Don't have an account?", ' ',
        createElement('button', { onClick: () => { setIsSignUp(!isSignUp) }, className: 'font-semibold transition-colors', style: { color: '#ff4f00' }, onMouseEnter: (e) => { e.currentTarget.style.opacity = '0.8' }, onMouseLeave: (e) => { e.currentTarget.style.opacity = '1' }, type: 'button' }, `Click here to ${isSignUp ? 'sign in' : 'sign up'}`)
      )
    )
  )
}
