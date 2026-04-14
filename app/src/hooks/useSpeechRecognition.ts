import { useCallback, useEffect, useRef, useState } from 'react'

export function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function useSpeechRecognition(options: {
  lang?: string
  onError?: (message: string) => void
}) {
  const { lang = 'en-US', onError } = options
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [finalText, setFinalText] = useState('')
  const recRef = useRef<SpeechRecognition | null>(null)
  const bufferRef = useRef('')
  const finalTextRef = useRef('')

  useEffect(() => {
    finalTextRef.current = finalText
  }, [finalText])

  const supported = getSpeechRecognitionCtor() !== null

  const stop = useCallback(() => {
    recRef.current?.stop()
    recRef.current = null
    setListening(false)
  }, [])

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      onError?.('Speech recognition is not supported in this browser. Try Chrome or Edge.')
      return
    }

    recRef.current?.abort()
    const existing = finalTextRef.current.trim()
    bufferRef.current = existing ? `${existing} ` : ''
    setInterim('')

    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = lang
    rec.maxAlternatives = 1

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interimPiece = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        const piece = r[0]?.transcript ?? ''
        if (r.isFinal) {
          bufferRef.current += piece
        } else {
          interimPiece += piece
        }
      }
      setFinalText(bufferRef.current.trim())
      setInterim(interimPiece.trim())
    }

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return
      const msg =
        e.error === 'not-allowed'
          ? 'Microphone permission denied. Allow mic access for dictation.'
          : e.error === 'network'
            ? 'Network error during recognition. Check your connection.'
            : `Recognition error: ${e.error}`
      onError?.(msg)
    }

    rec.onend = () => {
      setListening(false)
      setInterim('')
      setFinalText(bufferRef.current.trim())
      finalTextRef.current = bufferRef.current.trim()
      recRef.current = null
    }

    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      onError?.('Could not start microphone. Check permissions.')
      setListening(false)
    }
  }, [lang, onError])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  useEffect(() => {
    return () => {
      recRef.current?.abort()
    }
  }, [])

  const displayTranscript = [finalText, interim].filter(Boolean).join(finalText && interim ? ' ' : '')

  const setTranscriptManual = useCallback((text: string) => {
    bufferRef.current = text
    finalTextRef.current = text
    setFinalText(text)
    setInterim('')
  }, [])

  return {
    supported,
    listening,
    interim,
    finalText,
    displayTranscript,
    start,
    stop,
    toggle,
    setTranscriptManual,
  }
}
