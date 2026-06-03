'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollReset() {
  const pathname = usePathname()

  // scrollRestoration=manual est déjà posé par le script inline dans <head>
  // On scroll en haut uniquement lors des navigations client-side
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
