'use client'

import { useState } from 'react'
import { Icon } from './Icon'

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url, title })
      } catch {}
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <button type="button" className="btn btn-ghost" onClick={share}>
      <Icon name={copied ? 'check' : 'compartir'} size={18} /> {copied ? 'Link copiado' : 'Compartir'}
    </button>
  )
}
