import type { ReactNode } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { ByteLogo } from '@/components/ByteLogo'
import { NoirByteMark } from '@/components/noir/NoirPrimitives'
import { cn } from '@/components/ui/utils'

type Props = {
  onBack?: () => void
  /** Voice / modal-style screens use ✕; others use chevron. */
  backIcon?: 'chevron' | 'close'
  backLabel?: string
  rightSlot?: ReactNode
  eyebrow?: string
  title?: string
  subtitle?: ReactNode
  /** Dark editorial shell (Byte · Noir). */
  variant?: 'default' | 'noir'
}

export function AppScreenHeader({
  onBack,
  backIcon = 'chevron',
  backLabel,
  rightSlot,
  eyebrow,
  title,
  subtitle,
  variant = 'noir',
}: Props) {
  const noir = variant === 'noir'
  const label = backLabel ?? (backIcon === 'close' ? 'Close' : 'Back')
  const BackIcon = backIcon === 'close' ? X : ChevronLeft

  return (
    <header
      className={cn(
        'px-6 pb-8 pt-[max(3rem,env(safe-area-inset-top))]',
        noir ? 'border-b border-[var(--line)]' : 'border-b border-stone-200/80',
      )}
    >
      <div className="relative mb-10 flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            aria-label={label}
            onClick={onBack}
            className={cn(
              '-ml-1 rounded-full p-2 transition-colors',
              noir
                ? 'text-[var(--paper)] hover:bg-[var(--paper)]/10'
                : 'text-stone-500 hover:bg-stone-200/40 hover:text-stone-800',
            )}
          >
            <BackIcon className="h-5 w-5" strokeWidth={1.75} />
          </button>
        ) : (
          <div className="w-9" aria-hidden />
        )}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {noir ? <NoirByteMark size="sm" /> : <ByteLogo />}
        </div>
        <div className="flex min-w-9 justify-end">{rightSlot ?? <span className="w-9" aria-hidden />}</div>
      </div>
      {(eyebrow || title || subtitle) && (
        <div className="text-center">
          {eyebrow && (
            <p
              className={cn(
                'eyebrow mb-2 opacity-70',
                noir ? 'text-[var(--paper)]/70' : 'text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400',
              )}
            >
              {eyebrow}
            </p>
          )}
          {title && (
            <h1
              className={cn(
                noir
                  ? 'display-serif text-[1.375rem] leading-snug tracking-tight text-[var(--paper)]'
                  : 'text-[1.375rem] font-medium leading-snug tracking-[-0.02em] text-stone-900',
              )}
            >
              {title}
            </h1>
          )}
          {subtitle != null && subtitle !== '' && (
            <div
              className={cn(
                'mx-auto mt-2 max-w-[18rem] text-sm leading-relaxed',
                noir ? 'text-[var(--paper)]/55' : 'text-stone-500',
              )}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
    </header>
  )
}
