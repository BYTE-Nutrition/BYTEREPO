import logo from '@/assets/byte-logo.jpg'
import { cn } from '@/components/ui/utils'

type ByteLogoProps = {
  className?: string
  /** Larger mark in headers */
  size?: 'sm' | 'md'
}

export function ByteLogo({ className, size = 'md' }: ByteLogoProps) {
  const h = size === 'sm' ? 'h-6' : 'h-7'
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-2xl bg-white px-2 py-1.5 shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/70',
        className,
      )}
      role="img"
      aria-label="Byte"
    >
      <img src={logo} alt="" className={cn('w-auto max-w-[5.25rem] object-contain object-center', h)} decoding="async" />
    </span>
  )
}
