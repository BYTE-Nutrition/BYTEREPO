import React from 'react'

type ByteLogoMarkProps = {
  className?: string
}

export function ByteLogoMark({ className = '' }: ByteLogoMarkProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl bg-white px-3 py-1.5 shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] ring-1 ring-black/10 ${className}`}
    >
      <span className="text-[1.05rem] font-black tracking-[0.08em] text-black md:text-[1.15rem]">BYTE</span>
    </span>
  )
}
