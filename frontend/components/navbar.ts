'use client'

import { createElement, useEffect, useState } from 'react'
import Link from 'next/link'
import { LogOut, Moon, Sun, UserCircle } from 'lucide-react'

import { useTheme } from '@/app/theme-provider'
import { BrandLogo } from '@/components/brand-logo'
import type { AuthUser } from '@/lib/auth'

interface NavbarProps {
  onSignInClick?: () => void
  authUser?: AuthUser | null
  onSignOut?: () => void
}

export function Navbar({ onSignInClick, authUser, onSignOut }: NavbarProps) {
  const [mounted, setMounted] = useState<boolean>(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authUser) setIsUserMenuOpen(false)
  }, [authUser])

  const navBgColor = mounted ? (theme === 'dark' ? 'rgba(20, 15, 11, 0.78)' : 'rgba(255, 250, 243, 0.78)') : 'rgba(20, 15, 11, 0.78)'
  const navBorderColor = mounted ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(150, 111, 81, 0.16)') : 'rgba(255, 255, 255, 0.1)'
  const textColor = mounted ? (theme === 'dark' ? '#f5f0e8' : '#241710') : '#f5f0e8'
  const linkColor = mounted ? (theme === 'dark' ? '#d3c8bc' : '#6e6257') : '#d3c8bc'
  const linkHoverColor = mounted ? (theme === 'dark' ? '#fff7ee' : '#241710') : '#fff7ee'
  const themeBgColor = mounted ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 106, 42, 0.1)') : 'rgba(255, 255, 255, 0.08)'
  const menuBgColor = mounted ? (theme === 'dark' ? '#241b15' : '#fffaf3') : '#241b15'

  return createElement(
    'nav',
    { className: 'sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-colors', style: { backgroundColor: navBgColor, borderColor: navBorderColor } },
    createElement(
      'div',
      { className: 'mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8' },
      createElement(
        Link,
        { href: '/', className: 'rounded-[0.85rem] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#ff4f00]' },
        createElement(BrandLogo, { textColor, compact: true })
      ),
      createElement(
        'div',
        { className: 'flex items-center gap-8' },
        createElement(
          'div',
          { className: 'hidden gap-8 md:flex' },
          createElement(Link, { href: '#features', className: 'text-sm transition-colors', style: { color: linkColor }, onMouseEnter: (e) => { e.currentTarget.style.color = linkHoverColor }, onMouseLeave: (e) => { e.currentTarget.style.color = linkColor } }, 'Features'),
          createElement(Link, { href: '#how-it-works', className: 'text-sm transition-colors', style: { color: linkColor }, onMouseEnter: (e) => { e.currentTarget.style.color = linkHoverColor }, onMouseLeave: (e) => { e.currentTarget.style.color = linkColor } }, 'How it works')
        ),
        createElement('button', { onClick: toggleTheme, className: 'rounded-[8px] p-2 transition-colors', style: { backgroundColor: themeBgColor, color: '#ff4f00' }, title: 'Toggle theme', type: 'button' }, mounted && theme === 'dark' ? createElement(Sun, { size: 20 }) : createElement(Moon, { size: 20 })),
        authUser
          ? createElement(
              'div',
              { className: 'relative' },
              createElement(
                'button',
                {
                  onClick: () => setIsUserMenuOpen((value) => !value),
                  className: 'flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                  style: { backgroundColor: '#ff4f00', borderColor: 'rgba(255, 255, 255, 0.22)', color: '#fffefb' },
                  type: 'button',
                  title: 'Account',
                  'aria-label': 'Account menu',
                  'aria-expanded': isUserMenuOpen,
                },
                createElement(UserCircle, { size: 23 })
              ),
              isUserMenuOpen
                ? createElement(
                    'div',
                    { className: 'absolute right-0 top-14 w-56 rounded-[0.9rem] border p-2 shadow-2xl', style: { backgroundColor: menuBgColor, borderColor: navBorderColor } },
                    createElement('div', { className: 'px-3 py-2' },
                      createElement('p', { className: 'truncate text-sm font-semibold', style: { color: textColor } }, authUser.name || 'Signed in'),
                      createElement('p', { className: 'truncate text-xs', style: { color: linkColor } }, authUser.email)
                    ),
                    createElement(
                      'button',
                      {
                        onClick: onSignOut,
                        className: 'mt-1 flex w-full items-center gap-2 rounded-[0.7rem] px-3 py-2 text-left text-sm font-semibold transition-colors',
                        style: { color: '#ff4f00' },
                        type: 'button',
                      },
                      createElement(LogOut, { size: 16 }),
                      'Sign out'
                    )
                  )
                : null
            )
          : createElement('button', { onClick: onSignInClick, className: 'rounded-[12px] px-6 py-3 text-sm font-semibold transition-colors', style: { backgroundColor: '#ff4f00', color: '#fffefb' }, onMouseEnter: (e) => { e.currentTarget.style.backgroundColor = '#e64500' }, onMouseLeave: (e) => { e.currentTarget.style.backgroundColor = '#ff4f00' }, type: 'button' }, 'Sign In')
      )
    )
  )
}
