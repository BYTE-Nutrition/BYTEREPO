import { useEffect } from 'react'
import logo from '../assets/byte-logo.jpg'
import { useNavigate } from 'react-router-dom'

const SPLASH_MS = 2600

export function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = window.setTimeout(() => navigate('/home', { replace: true }), SPLASH_MS)
    return () => window.clearTimeout(t)
  }, [navigate])

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-white px-8">
      <img
        src={logo}
        alt=""
        className="landing-logo-reveal h-[clamp(4.5rem,22vw,7.5rem)] w-auto max-w-[min(100%,420px)] object-contain [animation-delay:120ms]"
        decoding="async"
      />
    </div>
  )
}
