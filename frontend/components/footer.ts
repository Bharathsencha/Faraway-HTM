'use client'

import { createElement } from 'react'

import { useTheme } from '@/app/theme-provider'
import { BrandLogo } from '@/components/brand-logo'

export function Footer() {
  const { theme } = useTheme()

  const textColor = theme === 'dark' ? '#f5f0e8' : '#241710'
  const linkStyle = { color: theme === 'dark' ? '#d3c8bc' : '#6e6257' }
  const hoverColor = theme === 'dark' ? '#fff7ee' : '#241710'
  const link = (label: string) => createElement('a', { href: '#', className: 'transition', style: linkStyle, onMouseEnter: (e) => { (e.currentTarget as HTMLAnchorElement).style.color = hoverColor }, onMouseLeave: (e) => { (e.currentTarget as HTMLAnchorElement).style.color = linkStyle.color } }, label)

  return createElement(
    'footer',
    { className: 'px-4 py-16' },
    createElement('div', { className: 'mx-auto max-w-6xl' },
      createElement('div', { className: 'mb-16 grid grid-cols-1 gap-12 md:grid-cols-4' },
        createElement('div', null,
          createElement('div', { className: 'mb-4' }, createElement(BrandLogo, { textColor, compact: true })),
          createElement('p', { className: 'text-sm', style: linkStyle }, 'Gamified AI-powered interview preparation.')
        ),
        createElement('div', null, createElement('h4', { className: 'mb-4 font-semibold', style: { color: textColor } }, 'Product'), createElement('ul', { className: 'space-y-2 text-sm' }, createElement('li', null, link('Features')), createElement('li', null, link('Pricing')), createElement('li', null, link('Blog')))),
        createElement('div', null, createElement('h4', { className: 'mb-4 font-semibold', style: { color: textColor } }, 'Company'), createElement('ul', { className: 'space-y-2 text-sm' }, createElement('li', null, link('About')), createElement('li', null, link('Careers')), createElement('li', null, link('Contact')))),
        createElement('div', null, createElement('h4', { className: 'mb-4 font-semibold', style: { color: textColor } }, 'Legal'), createElement('ul', { className: 'space-y-2 text-sm' }, createElement('li', null, link('Privacy')), createElement('li', null, link('Terms')), createElement('li', null, link('Cookies'))))
      ),
      createElement('div', { className: 'flex flex-col items-center justify-between border-t pt-8 text-sm sm:flex-row', style: { color: linkStyle.color, borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(150, 111, 81, 0.16)'}` } },
        createElement('p', null, 'Copyright 2026 Interview Arena. All rights reserved.'),
        createElement('div', { className: 'mt-6 flex gap-6 sm:mt-0' }, link('X'), link('LinkedIn'), link('Discord'))
      )
    )
  )
}
