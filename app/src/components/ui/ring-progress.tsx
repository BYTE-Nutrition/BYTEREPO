import type { ReactNode } from 'react'
import { cn } from './utils'

type RingProgressProps = {
  /** Progress amount (e.g. calories consumed). */
  value: number
  /** Value that equals 100% of the ring (e.g. calorie goal). */
  max: number
  size: number
  strokeWidth: number
  className?: string
  trackClassName?: string
  progressClassName?: string
  children?: ReactNode
}

export function RingProgress({
  value,
  max,
  size,
  strokeWidth,
  className,
  trackClassName,
  progressClassName,
  children,
}: RingProgressProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg className="size-full -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn('text-black/10', trackClassName)}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className={cn('text-amber-400', progressClassName)}
          stroke="currentColor"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        {children}
      </div>
    </div>
  )
}
