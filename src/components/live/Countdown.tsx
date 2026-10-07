'use client'

import { useEffect, useState } from 'react'
import { timeLeft } from '@/lib/time'

/** "quedan 47 min" que se actualiza solo. */
export function Countdown({ endsAt, className = '' }: { endsAt: string; className?: string }) {
  const end = new Date(endsAt)
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])
  const ms = end.getTime() - Date.now()
  return (
    <span className={`countdown${ms < 3600_000 ? ' hot' : ''} ${className}`} suppressHydrationWarning>
      {timeLeft(end)}
    </span>
  )
}
