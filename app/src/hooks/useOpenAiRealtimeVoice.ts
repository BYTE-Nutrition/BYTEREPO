import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'

import { BYTE_REALTIME_COACH_BASE } from '@/lib/realtimeCoachBase'
import { buildAssistantMealContextFromLive, mealParsePipelineConfigured } from '@/lib/realtimeMealContext'
import type { MealItem } from '@/lib/types'
import type { VoiceTranscriptMessage } from '@/lib/voiceTranscript'

export type RealtimeVoiceStatus = 'idle' | 'connecting' | 'live' | 'error'

export type UseOpenAiRealtimeVoiceOptions = {
  /** Full URL to your SDP relay (e.g. VITE_REALTIME_SESSION_URL). If empty, connect is a no-op. */
  sessionUrl: string | undefined
  /** Remote model audio */
  audioRef: RefObject<HTMLAudioElement | null>
  /** Mic opened on the entry button (same user gesture); avoids a second tap for getUserMedia after navigation. */
  takePrimedStream?: () => MediaStream | null
  /** Sent as `X-Byte-Goals` when posting SDP (e.g. daily macro targets for the Realtime session). */
  goalsHeader?: string
  onError?: (message: string) => void
  /** Parsed meal lines (USDA-backed when meal-parse is configured) — pushed into Realtime instructions. */
  mealLiveItems?: MealItem[]
  /** Optional hint for session instructions when Realtime user transcript is still empty (not used for the chat log). */
  coachTranscriptFallback?: string
}

const MAX_CONVERSATION_MESSAGES = 50

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

const MAX_INSTRUCTIONS_CHARS = 12_000

function pushSessionInstructions(dc: RTCDataChannel, instructions: string) {
  if (dc.readyState !== 'open') return
  const text =
    instructions.length > MAX_INSTRUCTIONS_CHARS
      ? `${instructions.slice(0, MAX_INSTRUCTIONS_CHARS)}\n\n[truncated]`
      : instructions
  if (!text.trim()) return
  dc.send(
    JSON.stringify({
      type: 'session.update',
      session: { type: 'realtime', instructions: text },
    }),
  )
}

function newMsgId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function capMessages(prev: VoiceTranscriptMessage[]): VoiceTranscriptMessage[] {
  if (prev.length <= MAX_CONVERSATION_MESSAGES) return prev
  return prev.slice(-MAX_CONVERSATION_MESSAGES)
}

/**
 * OpenAI Realtime over WebRTC: mic + remote audio + `oai-events` data channel.
 * SDP is exchanged via your backend (see app/docs/REALTIME_SESSION_API.md).
 */
export function useOpenAiRealtimeVoice(options: UseOpenAiRealtimeVoiceOptions) {
  const {
    sessionUrl,
    audioRef,
    takePrimedStream,
    goalsHeader,
    onError,
    mealLiveItems = [],
    coachTranscriptFallback = '',
  } = options
  const [status, setStatus] = useState<RealtimeVoiceStatus>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const [userTranscript, setUserTranscript] = useState('')
  const [assistantSpeaking, setAssistantSpeaking] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [conversationMessages, setConversationMessages] = useState<VoiceTranscriptMessage[]>([])

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const committedUserRef = useRef('')
  const segmentUserRef = useRef('')
  // Bug: the SDP `fetch` and the awaits that follow it had no way to be cancelled.
  // If the user closed the immersive view (or another connect() started) while the
  // SDP exchange was in flight, the fetch would still resolve, then the code
  // would try to setRemoteDescription on a closed pc, throw, and the catch would
  // surface a "Voice unavailable" banner the user never caused. Track an
  // AbortController per connect attempt so disconnect() can cancel it cleanly.
  const connectAbortRef = useRef<AbortController | null>(null)

  const disconnect = useCallback(() => {
    setAssistantSpeaking(false)
    setStatus('idle')
    // Intentionally keep committedUserRef / segmentUserRef / userTranscript / conversationMessages
    // so the paused "Submit for breakdown" screen still shows what the user said. `connect()`
    // clears these just before opening a fresh session.

    // Bug: in-flight SDP fetch / setRemoteDescription would resume after the pc
    // had already been closed below, throw, and surface a spurious "Voice
    // unavailable" error. Aborting before we null out pcRef lets connect()'s
    // catch block detect the intentional cancellation via signal.aborted.
    const ac = connectAbortRef.current
    connectAbortRef.current = null
    if (ac) ac.abort()

    dcRef.current = null
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

  const assistantInstructions = useMemo(() => {
    const text = (userTranscript.trim() || coachTranscriptFallback.trim()).trim()
    const block = buildAssistantMealContextFromLive(mealLiveItems, text, mealParsePipelineConfigured())
    return `${BYTE_REALTIME_COACH_BASE}\n\n## Structured meal estimates (updates as they cook)\n${block}`
  }, [coachTranscriptFallback, mealLiveItems, userTranscript])

  const assistantInstructionsRef = useRef('')
  assistantInstructionsRef.current = assistantInstructions

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
        // #region agent log
        fetch('http://127.0.0.1:7630/ingest/869a58af-96c5-49f4-bbdd-a35babd1f94f', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cb3770' },
          body: JSON.stringify({
            sessionId: 'cb3770',
            runId: 'pre-fix',
            hypothesisId: 'H1',
            location: 'useOpenAiRealtimeVoice.ts:handleDataMessage:error-event',
            message: 'Realtime data-channel type=error (may be non-fatal while session stays live)',
            data: { msgLen: msg.length, msgPreview: msg.slice(0, 120) },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
        onError?.(msg)
        return
      }

      if (type === 'response.created') {
        setAssistantSpeaking(true)
        setConversationMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.status === 'streaming') return prev
          return capMessages([
            ...prev,
            {
              id: newMsgId('a'),
              role: 'assistant',
              text: '',
              status: 'streaming',
              createdAt: Date.now(),
            },
          ])
        })
      }

      if (
        type === 'response.output_audio_transcript.delta' ||
        type === 'response.audio_transcript.delta'
      ) {
        const delta = String(event.delta ?? '')
        if (!delta) return
        setConversationMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.status === 'streaming') {
            return capMessages([...prev.slice(0, -1), { ...last, text: last.text + delta }])
          }
          return capMessages([
            ...prev,
            {
              id: newMsgId('a'),
              role: 'assistant',
              text: delta,
              status: 'streaming',
              createdAt: Date.now(),
            },
          ])
        })
      }

      if (type === 'response.output_text.delta' || type === 'response.text.delta') {
        const delta = String(event.delta ?? '')
        if (!delta) return
        setConversationMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.status === 'streaming') {
            return capMessages([...prev.slice(0, -1), { ...last, text: last.text + delta }])
          }
          return capMessages([
            ...prev,
            {
              id: newMsgId('a'),
              role: 'assistant',
              text: delta,
              status: 'streaming',
              createdAt: Date.now(),
            },
          ])
        })
      }

      if (
        type === 'response.output_audio_transcript.done' ||
        type === 'response.audio_transcript.done'
      ) {
        const full = String(event.transcript ?? '').trim()
        if (full) {
          setConversationMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === 'assistant' && last.status === 'streaming') {
              return capMessages([...prev.slice(0, -1), { ...last, text: full, status: 'final' }])
            }
            return capMessages([
              ...prev,
              {
                id: newMsgId('a'),
                role: 'assistant',
                text: full,
                status: 'final',
                createdAt: Date.now(),
              },
            ])
          })
        }
      }

      if (type === 'response.output_text.done' || type === 'response.text.done') {
        const full = String(event.text ?? '').trim()
        if (full) {
          setConversationMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === 'assistant' && last.status === 'streaming') {
              return capMessages([...prev.slice(0, -1), { ...last, text: full, status: 'final' }])
            }
            return capMessages([
              ...prev,
              {
                id: newMsgId('a'),
                role: 'assistant',
                text: full,
                status: 'final',
                createdAt: Date.now(),
              },
            ])
          })
        }
      }

      if (type === 'response.done' || type === 'response.completed') {
        setAssistantSpeaking(false)
        setConversationMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.status === 'streaming') {
            return capMessages([...prev.slice(0, -1), { ...last, status: 'final' }])
          }
          return prev
        })
      }

      if (type === 'conversation.item.input_audio_transcription.delta') {
        const delta = String(event.delta ?? '')
        segmentUserRef.current += delta
        const c = committedUserRef.current
        const s = segmentUserRef.current
        const running = c ? `${c} ${s}`.trim() : s
        setUserTranscript(running)
        setConversationMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'user' && last.status === 'streaming') {
            return capMessages([...prev.slice(0, -1), { ...last, text: s }])
          }
          return capMessages([
            ...prev,
            {
              id: newMsgId('u'),
              role: 'user',
              text: s,
              status: 'streaming',
              createdAt: Date.now(),
            },
          ])
        })
        return
      }

      if (type === 'conversation.item.input_audio_transcription.completed') {
        const tr = String(event.transcript ?? '').trim()
        if (tr) {
          committedUserRef.current = committedUserRef.current
            ? `${committedUserRef.current} ${tr}`.trim()
            : tr
        }
        segmentUserRef.current = ''
        const full = committedUserRef.current
        setUserTranscript(full)
        setConversationMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'user' && last.status === 'streaming') {
            return capMessages([
              ...prev.slice(0, -1),
              { ...last, text: tr || last.text, status: 'final' },
            ])
          }
          if (tr) {
            return capMessages([
              ...prev,
              {
                id: newMsgId('u'),
                role: 'user',
                text: tr,
                status: 'final',
                createdAt: Date.now(),
              },
            ])
          }
          return prev
        })
        const dc = dcRef.current
        if (dc && dc.readyState === 'open') {
          pushSessionInstructions(dc, assistantInstructionsRef.current)
        }
        return
      }
    },
    [onError],
  )

  const connect = useCallback(async () => {
    if (!sessionUrl?.trim()) {
      const msg = 'Realtime session URL is not configured'
      setLastError(msg)
      setStatus('error')
      onError?.(msg)
      return
    }

    // Bug: calling connect() while a previous connect() was still mid-await would
    // overwrite pcRef out from under the older invocation. The older one then
    // continued running setLocalDescription / fetch on a peer connection the new
    // call had already replaced, eventually throwing into its own catch and
    // tearing down the *new* session. disconnect() above now aborts the previous
    // attempt; we then mint a fresh AbortController for this attempt so the
    // signal.aborted check below can distinguish "we cancelled" from "real error".
    disconnect()
    setLastError(null)
    setStatus('connecting')
    committedUserRef.current = ''
    segmentUserRef.current = ''
    setUserTranscript('')
    setConversationMessages([])

    const ac = new AbortController()
    connectAbortRef.current = ac

    let attemptPc: RTCPeerConnection | undefined
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      attemptPc = pc
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

      let ms = takePrimedStream?.() ?? null
      if (!ms) {
        ms = await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      // Bug: getUserMedia is async; user could have closed the immersive view
      // while waiting on the permission prompt. Without this guard, we'd grab
      // the mic, attach tracks to a closed pc, and leave the mic LED on.
      if (ac.signal.aborted || pcRef.current !== pc) {
        ms.getTracks().forEach((t) => t.stop())
        return
      }
      setLocalStream(ms)
      ms.getTracks().forEach((t) => pc.addTrack(t, ms))

      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc
      dc.addEventListener('message', (e) => {
        if (typeof e.data === 'string') handleDataMessage(e.data)
      })
      dc.addEventListener('open', () => {
        pushSessionInstructions(dc, assistantInstructionsRef.current)
      })

      const offer = await pc.createOffer()
      if (ac.signal.aborted || pcRef.current !== pc) return
      await pc.setLocalDescription(offer)
      if (ac.signal.aborted || pcRef.current !== pc) return

      const url = sessionUrl.trim()
      const sdpHeaders: Record<string, string> = {
        'Content-Type': 'application/sdp',
      }
      const goals = goalsHeader?.trim()
      if (goals) {
        sdpHeaders['X-Byte-Goals'] = goals
      }

      // Bug: fetch had no AbortSignal, so closing the page mid-handshake left a
      // dangling request that resolved into a closed pc. Threading ac.signal in
      // here means disconnect() can short-circuit the network call immediately.
      const sdpResponse = await fetch(url, {
        method: 'POST',
        body: offer.sdp ?? '',
        headers: sdpHeaders,
        signal: ac.signal,
      })
      if (ac.signal.aborted || pcRef.current !== pc) return

      if (!sdpResponse.ok) {
        let detail = sdpResponse.statusText
        try {
          const rawText = await sdpResponse.text()
          try {
            const j = JSON.parse(rawText) as {
              error?: string | { message?: string }
            }
            if (typeof j?.error === 'string' && j.error.trim()) detail = j.error.trim()
            else if (
              j?.error &&
              typeof j.error === 'object' &&
              typeof (j.error as { message?: unknown }).message === 'string'
            ) {
              detail = String((j.error as { message: string }).message).trim() || detail
            }
          } catch {
            if (rawText) detail = rawText.slice(0, 200)
          }
        } catch {
          // couldn't read body
        }
        if (import.meta.env.DEV) {
          console.error('[Byte realtime] POST session failed', sdpResponse.status, detail)
        }
        throw new Error(detail || 'Session request failed')
      }

      const answerSdp = await sdpResponse.text()
      if (ac.signal.aborted || pcRef.current !== pc) return
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      })
      if (ac.signal.aborted || pcRef.current !== pc) return

      setStatus('live')
    } catch (e) {
      // Bug: the catch used to fire setStatus('error') for any throw, including
      // the AbortError raised when the user simply closed the capture mid-flight.
      // That painted a red "Voice unavailable" banner over what was really a
      // user-initiated cancel. Treat aborted/superseded attempts as a no-op.
      if (ac.signal.aborted || (attemptPc !== undefined && pcRef.current !== attemptPc)) return
      disconnect()
      const msg = connectErrorMessage(e)
      setLastError(msg)
      setStatus('error')
      // #region agent log
      fetch('http://127.0.0.1:7630/ingest/869a58af-96c5-49f4-bbdd-a35babd1f94f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cb3770' },
        body: JSON.stringify({
          sessionId: 'cb3770',
          runId: 'pre-fix',
          hypothesisId: 'H4',
          location: 'useOpenAiRealtimeVoice.ts:connect:catch',
          message: 'connect() failed — onError invoked, status set to error',
          data: { msgLen: msg.length, msgPreview: msg.slice(0, 120) },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      onError?.(msg)
    }
  }, [audioRef, disconnect, goalsHeader, handleDataMessage, onError, sessionUrl, takePrimedStream])

  useEffect(() => {
    if (status !== 'live') return
    const dc = dcRef.current
    if (!dc) return
    const t = window.setTimeout(() => {
      pushSessionInstructions(dc, assistantInstructionsRef.current)
    }, 450)
    return () => window.clearTimeout(t)
  }, [assistantInstructions, status])

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
    conversationMessages,
    connect,
    disconnect,
  }
}
