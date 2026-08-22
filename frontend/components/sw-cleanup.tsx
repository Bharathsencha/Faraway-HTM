'use client'

import { useEffect } from 'react'

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isLocalDev =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (!isLocalDev) return

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister().catch(() => {})
          })
        })
        .catch(() => {})
    }
  }, [])

  return null
}
