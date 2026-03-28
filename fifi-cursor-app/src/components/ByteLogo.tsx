export function ByteLogo({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-semibold tracking-tight text-lg select-none ${className}`}
      aria-label="Byte"
    >
      Byte
    </span>
  )
}
