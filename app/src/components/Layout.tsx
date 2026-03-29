import type { ReactNode } from 'react'
import { BottomNav } from '@/components/BottomNav'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-md pb-28">{children}</div>
      <BottomNav />
    </div>
  )
}
