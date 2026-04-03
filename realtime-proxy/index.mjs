/**
 * Minimal OpenAI Realtime WebRTC proxy (unified SDP relay).
 * POST raw offer SDP to /realtime/session — returns answer SDP.
 * Requires OPENAI_API_KEY in the environment (never expose to the browser).
 */
import cors from 'cors'
import express from 'express'

const PORT = Number(process.env.PORT) || 5050
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const sessionConfig = JSON.stringify({
  type: 'realtime',
  model: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-mini',
  instructions:
    process.env.BYTE_REALTIME_INSTRUCTIONS ||
    'You are Byte, a friendly cooking and meal logging companion. Help the user describe what they ate with short, practical replies. You may briefly suggest cooking tips. Keep spoken responses concise.',
  audio: {
    input: {
      transcription: { model: 'gpt-4o-mini-transcribe' },
    },
    output: { voice: process.env.OPENAI_REALTIME_VOICE || 'marin' },
  },
})

function corsOptions() {
  const raw = process.env.ALLOWED_ORIGINS
  if (!raw || raw === '*') {
    return { origin: true }
  }
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean)
  return {
    origin(origin, cb) {
      if (!origin || list.includes(origin)) {
        cb(null, true)
        return
      }
      cb(new Error('Not allowed by CORS'))
    },
  }
}

const app = express()
app.use(cors(corsOptions()))
app.use(express.text({ type: ['application/sdp', 'text/plain'], limit: '256kb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// Browsers open URLs with GET — this route is POST-only (WebRTC SDP from the app).
app.get('/realtime/session', (_req, res) => {
  res.type('text/plain').send(
    'byte-realtime-proxy: this URL is for POST only (SDP offer body). ' +
      'Opening it in a tab will not work. Use the Byte app with VITE_REALTIME_SESSION_URL set to this full URL.',
  )
})

app.post('/realtime/session', async (req, res) => {
  if (!OPENAI_API_KEY) {
    res.status(500).json({ error: 'Server misconfiguration: OPENAI_API_KEY is not set' })
    return
  }

  const sdpOffer = typeof req.body === 'string' ? req.body : ''
  if (!sdpOffer.trim()) {
    res.status(400).json({ error: 'Expected SDP offer body' })
    return
  }

  const fd = new FormData()
  fd.set('sdp', sdpOffer)
  fd.set('session', sessionConfig)

  try {
    const r = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: fd,
    })

    const text = await r.text()
    if (!r.ok) {
      console.error('OpenAI realtime/calls error', r.status, text.slice(0, 500))
      res.status(502).json({ error: 'Upstream realtime session failed' })
      return
    }

    res.type('application/sdp').send(text)
  } catch (e) {
    console.error('realtime proxy', e)
    res.status(500).json({ error: 'Failed to create realtime session' })
  }
})

app.listen(PORT, () => {
  console.log(`byte-realtime-proxy listening on http://localhost:${PORT}`)
  console.log(`  POST http://localhost:${PORT}/realtime/session`)
})
