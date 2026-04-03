import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

export type RealtimeVoiceStatus = 'idle' | 'connecting' | 'live' | 'error'

export type UseOpenAiRealtimeVoiceOptions = {
  /** Full URL to your SDP relay (e.g. VITE_REALTIME_SESSION_URL). If empty, connect is a no-op. */
  sessionUrl: string | undefined
  /** Remote model audio */
  audioRef: RefObject<HTMLAudioElement | null>
  onError?: (message: string) => void
}

function connectErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const m = error.message
    if (
      m === 'Failed to fetch' ||
      m === 'Load failed' ||
      m.includes('NetworkError when attempting to fetch')
    ) {
      return "Can't connect to live voice. Start the voice server (in the realtime-proxy folder: npm start), then refresh this page and try again."
    }
    return m
  }
  return "Couldn't start live voice."
}

function parseEvent(raw: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(raw) as unknown
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/**
 * OpenAI Realtime over WebRTC: mic + remote audio + `oai-events` data channel.
 * SDP is exchanged via your backend (see app/docs/REALTIME_SESSION_API.md).
 */
export function useOpenAiRealtimeVoice(options: UseOpenAiRealtimeVoiceOptions) {
  const { sessionUrl, audioRef, onError } = options
  const [status, setStatus] = useState<RealtimeVoiceStatus>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const [userTranscript, setUserTranscript] = useState('')
  const [assistantSpeaking, setAssistantSpeaking] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const committedUserRef = useRef('')
  const segmentUserRef = useRef('')

  const disconnect = useCallback(() => {
    committedUserRef.current = ''
    segmentUserRef.current = ''
    setUserTranscript('')
    setAssistantSpeaking(false)
    setStatus('idle')

    const pc = pcRef.current
    pcRef.current = null
    if (pc) {
      pc.getSenders().forEach((s) => {
        if (s.track) s.track.stop()
      })
      pc.close()
    }

    setLocalStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop())
      return null
    })

    const el = audioRef.current
    if (el) {
      el.srcObject = null
    }
  }, [audioRef])

  const applyUserEvent = useCallback((event: Record<string, unknown>) => {
    const type = String(event.type ?? '')
    if (type === 'conversation.item.input_audio_transcription.delta') {
      const delta = String(event.delta ?? '')
      segmentUserRef.current += delta
      const c = committedUserRef.current
      const s = segmentUserRef.current
      setUserTranscript(c ? `${c} ${s}`.trim() : s)
      return
    }
    if (type === 'conversation.item.input_audio_transcription.completed') {
      const tr = String(event.transcript ?? '').trim()
      if (tr) {
        committedUserRef.current = committedUserRef.current
          ? `${committedUserRef.current} ${tr}`.trim()
          : tr
        segmentUserRef.current = ''
        setUserTranscript(committedUserRef.current)
      }
      return
    }
  }, [])

  const handleDataMessage = useCallback(
    (raw: string) => {
      const event = parseEvent(raw)
      if (!event) return

      const type = String(event.type ?? '')

      if (type === 'error') {
        const msg =
          typeof event.error === 'object' && event.error && 'message' in event.error
            ? String((event.error as { message?: unknown }).message ?? 'Realtime error')
            : 'Realtime error'
        setLastError(msg)
        onError?.(msg)
        return
      }

      if (type === 'response.created') {
        setAssistantSpeaking(true)
      }
      if (type === 'response.done' || type === 'response.completed') {
        setAssistantSpeaking(false)
      }

      applyUserEvent(event)
    },
    [applyUserEvent, onError],
  )

  const connect = useCallback(async () => {
    if (!sessionUrl?.trim()) {
      const msg = 'Realtime session URL is not configured'
      setLastError(msg)
      setStatus('error')
      onError?.(msg)
      return
    }

    disconnect()
    setLastError(null)
    setStatus('connecting')
    committedUserRef.current = ''
    segmentUserRef.current = ''
    setUserTranscript('')

    let pc: RTCPeerConnection
    try {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      pcRef.current = pc

      pc.ontrack = (e) => {
        const el = audioRef.current
        if (el && e.streams[0]) {
          el.srcObject = e.streams[0]
          el.play().catch(() => {
            /* autoplay may need gesture; user already tapped mic */
          })
        }
      }

      const ms = await navigator.mediaDevices.getUserMedia({ audio: true })
      setLocalStream(ms)
      ms.getTracks().forEach((t) => pc.addTrack(t, ms))

      const dc = pc.createDataChannel('oai-events')
      dc.addEventListener('message', (e) => {
        if (typeof e.data === 'string') handleDataMessage(e.data)
      })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const url = sessionUrl.trim()
      const sdpResponse = await fetch(url, {
        method: 'POST',
        body: offer.sdp ?? '',
        headers: {
          'Content-Type': 'application/sdp',
        },
      })

      if (!sdpResponse.ok) {
        let detail = sdpResponse.statusText
        try {
          const j = (await sdpResponse.json()) as { error?: string }
          if (j?.error) detail = j.error
        } catch {
          const t = await sdpResponse.text()
          if (t) detail = t.slice(0, 200)
        }
        throw new Error(detail || 'Session request failed')
      }

      const answerSdp = await sdpResponse.text()
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      })

      setStatus('live')
    } catch (e) {
      disconnect()
      const msg = connectErrorMessage(e)
      setLastError(msg)
      setStatus('error')
      onError?.(msg)
    }
  }, [audioRef, disconnect, handleDataMessage, onError, sessionUrl])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    status,
    lastError,
    userTranscript,
    assistantSpeaking,
    localStream,
    connect,
    disconnect,
  }
}
