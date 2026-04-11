'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

function scrollDocumentToTop() {
  if (typeof window === 'undefined') return
  const root = document.scrollingElement ?? document.documentElement
  root.scrollTop = 0
  root.scrollLeft = 0
  document.documentElement.scrollTop = 0
  document.documentElement.scrollLeft = 0
  document.body.scrollTop = 0
  document.body.scrollLeft = 0
  window.scrollTo(0, 0)
}

export default function ScrollReset() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    scrollDocumentToTop()
  }, [pathname])

  useLayoutEffect(() => {
    scrollDocumentToTop()
    const t = window.setTimeout(scrollDocumentToTop, 0)
    let innerRaf = 0
    const outerRaf = window.requestAnimationFrame(() => {
      scrollDocumentToTop()
      innerRaf = window.requestAnimationFrame(scrollDocumentToTop)
    })
    return () => {
      window.clearTimeout(t)
      window.cancelAnimationFrame(outerRaf)
      if (innerRaf) window.cancelAnimationFrame(innerRaf)
    }
  }, [])

  return null
}
