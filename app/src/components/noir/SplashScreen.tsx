import { useEffect } from 'react'
import { NoirStatusBar } from './NoirPrimitives'

const SPLASH_DONE_MS = 2200

type Props = {
  onDone: () => void
}

/**
 * Full-screen BYTE splash — grain, orb, logo reveal, progress bar. Parent must sit under `.byte-noir`.
 */
export function SplashScreen({ onDone }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDone, SPLASH_DONE_MS)
    return () => window.clearTimeout(t)
  }, [onDone])

  return (
    <div className="relative min-h-svh w-full overflow-hidden bg-[var(--ink)] text-[var(--paper)]">
      <NoirStatusBar dark />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="noir-splash-orb absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full opacity-35"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 65%)',
          }}
        />
      </div>

      <div className="noir-canvas-bg noir-grain absolute inset-0 flex flex-col items-center justify-center">
        <div className="noir-logo-reveal text-[var(--paper)] leading-none" style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontWeight: 900, fontSize: 92, letterSpacing: '-0.03em' }}>
          BYTE
        </div>
        <div
          className="noir-logo-reveal mt-5 font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--paper)]/45"
          style={{ animationDelay: '500ms' }}
        >
          A cooking intelligence
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-10 left-0 right-0 flex justify-center">
        <div className="h-[2px] w-20 overflow-hidden bg-[var(--paper)]/15">
          <div className="noir-splash-bar-fill h-full w-full bg-[var(--paper)]" />
        </div>
      </div>
    </div>
  )
}
