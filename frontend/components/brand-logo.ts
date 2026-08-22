'use client'

import { createElement } from 'react'
import Image from 'next/image'

interface BrandLogoProps {
  textColor: string
  label?: string
  subtitle?: string
  compact?: boolean
}

export function BrandLogo({ label = 'Interview Arena', compact = false }: BrandLogoProps) {
  const size = compact ? 170 : 300

  return createElement(
    Image,
    {
      src: '/interview-arena-logo.png',
      alt: label,
      width: size,
      height: Math.round(size / 3.06),
      className: 'block h-auto w-auto max-w-none shrink-0 select-none bg-transparent',
      style: { width: `${size}px`, height: 'auto' },
      draggable: false,
      priority: true,
    }
  )
}
