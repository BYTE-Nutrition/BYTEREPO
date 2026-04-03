import { useEffect, useRef, useState } from 'react'

/**
 * RMS-ish level 0–1 from microphone while `active` is true.
 * Pass `sharedStream` to reuse the same track as another consumer (e.g. OpenAI Realtime)
 * and avoid a second getUserMedia prompt.
 */
export function useMicLevel(
  active: boolean,
  sharedStream?: MediaStream | null,
): { level: number; error: string | null } {
  const [level, setLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
      setLevel(0)
      return
    }

    if (sharedStream) {
      let ctx: AudioContext | null = null
      let cancelled = false

      const stop = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
        void ctx?.close()
        ctx = null
      }

      ;(async () => {
        try {
          setError(null)
          ctx = new AudioContext()
          const source = ctx.createMediaStreamSource(sharedStream)
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 256
          analyser.smoothingTimeConstant = 0.65
          source.connect(analyser)
          const data = new Uint8Array(analyser.frequencyBinCount)

          const tick = () => {
            if (cancelled) return
            analyser.getByteFrequencyData(data)
            let sum = 0
            for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
            const rms = Math.sqrt(sum / data.length) / 255
            setLevel(Math.min(1, rms * 2.2))
            rafRef.current = requestAnimationFrame(tick)
          }
          rafRef.current = requestAnimationFrame(tick)
        } catch {
          if (!cancelled) {
            setError('Microphone unavailable for visualization')
            setLevel(0)
          }
        }
      })()

      return () => {
        cancelled = true
        stop()
      }
    }

    let stream: MediaStream | null = null
    let ctx: AudioContext | null = null
    let cancelled = false

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
      stream?.getTracks().forEach((t) => t.stop())
      stream = null
      void ctx?.close()
      ctx = null
    }

    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) {
          stop()
          return
        }
        setError(null)
        ctx = new AudioContext()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.65
        source.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)

        const tick = () => {
          analyser.getByteFrequencyData(data)
          let sum = 0
          for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
          const rms = Math.sqrt(sum / data.length) / 255
          setLevel(Math.min(1, rms * 2.2))
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch {
        if (!cancelled) {
          setError('Microphone unavailable for visualization')
          setLevel(0)
        }
      }
    })()

    return () => {
      cancelled = true
      stop()
    }
  }, [active, sharedStream])

  return { level, error }
}
