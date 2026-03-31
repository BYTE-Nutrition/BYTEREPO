import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { cn } from '@/components/ui/utils'

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'

  return (
    <div
      className={cn(
        'min-h-svh',
        isLanding ? 'bg-white' : 'bg-gradient-to-b from-stone-100/90 via-stone-50/80 to-white',
      )}
    >
      <div className={cn('mx-auto max-w-md', isLanding ? 'pb-8' : 'pb-32')}>{children}</div>
      {!isLanding && <BottomNav />}
    </div>
  )
}
