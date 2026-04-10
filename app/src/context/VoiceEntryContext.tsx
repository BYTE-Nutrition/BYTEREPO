import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react'

type VoiceEntryContextValue = {
  /** Call from the mic button tap (same gesture) before navigating to voice. */
  primeMic: () => Promise<void>
  /** Realtime connect uses this first; clears the ref. */
  takePrimedStream: () => MediaStream | null
  /** Stop and clear primed mic if the user leaves without connecting (e.g. close capture). */
  releasePrimedMic: () => void
}

const VoiceEntryContext = createContext<VoiceEntryContextValue | null>(null)

export function VoiceEntryProvider({ children }: { children: ReactNode }) {
  const streamRef = useRef<MediaStream | null>(null)

  const primeMic = useCallback(async () => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      streamRef.current = null
    }
  }, [])

  const takePrimedStream = useCallback(() => {
    const s = streamRef.current
    streamRef.current = null
    return s
  }, [])

  const releasePrimedMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  return (
    <VoiceEntryContext.Provider value={{ primeMic, takePrimedStream, releasePrimedMic }}>
      {children}
    </VoiceEntryContext.Provider>
  )
}

export function useVoiceEntry(): VoiceEntryContextValue {
  const ctx = useContext(VoiceEntryContext)
  if (!ctx) {
    throw new Error('useVoiceEntry must be used within VoiceEntryProvider')
  }
  return ctx
}
