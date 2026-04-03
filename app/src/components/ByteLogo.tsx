import { cn } from '@/components/ui/utils'

type ByteLogoProps = {
  className?: string
}

/** Wordmark — text renders “BYTE” reliably (image asset was misread as “BITE”). */
export function ByteLogo({ className }: ByteLogoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-2xl bg-white px-3 py-1.5 shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/70',
        className,
      )}
      role="img"
      aria-label="Byte"
    >
      <span className="text-[1.05rem] font-black tracking-[0.08em] text-stone-900">BYTE</span>
    </span>
  )
}
