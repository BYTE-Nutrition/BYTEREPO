import logo from '@/assets/byte-logo.png'

type ByteLogoMarkProps = {
  className?: string
}

export function ByteLogoMark({ className = '' }: ByteLogoMarkProps) {
  return (
    <img
      src={logo}
      alt="Byte"
      className={`h-8 w-auto object-contain object-left md:h-9 ${className}`}
      decoding="async"
    />
  )
}
