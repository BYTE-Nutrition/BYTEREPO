import logo from '@/assets/byte-logo.jpg'
import { cn } from '@/components/ui/utils'

type ByteLogoProps = {
  className?: string
}

export function ByteLogo({ className }: ByteLogoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-2xl bg-white px-2 py-1.5 shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/70',
        className,
      )}
      role="img"
      aria-label="Byte"
    >
      <img
        src={logo}
        alt=""
        className="h-7 w-auto max-w-[5.25rem] object-contain object-center"
        decoding="async"
      />
    </span>
  )
}
