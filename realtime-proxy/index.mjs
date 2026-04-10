/**
 * Byte realtime-proxy: Realtime WebRTC SDP relay + optional meal-parse (Chat Completions).
 *
 * OPENAI_API_KEY must be set as an environment variable on your hosting platform
 * (e.g. Railway, Render, Fly.io for this Node server). Never hardcode it in this file
 * or commit it to git. The Vite frontend (Vercel/Netlify/etc.) only receives public
 * URLs via VITE_* vars — never put the OpenAI key in the client bundle.
 *
 * Locally: copy `realtime-proxy/.env.example` to `realtime-proxy/.env` or run
 * `export OPENAI_API_KEY=...` before `npm start`. The key is read only from
 * `process.env` and is not logged or returned in any JSON/body response.
 */
import cors from 'cors'
import express from 'express'
import { registerMealParse } from './meal-parse.mjs'

const PORT = Number(process.env.PORT) || 5050
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const DEFAULT_BYTE_INSTRUCTIONS = `You are Byte, an AI nutrition coach that helps users track what they're cooking in real time. Your job is to:
1. Help users describe their meal as they cook — ask clarifying questions about quantities, cooking methods, and ingredients if they're vague (e.g. 'a little oil' → ask 'roughly how much — a teaspoon or a tablespoon?')
2. Give real-time feedback on the nutritional balance of what they're describing — flag if something is calorie-dense, high in sodium, or heavy on carbs
3. Suggest healthier swaps or additions when appropriate, but keep it conversational and non-judgmental
4. Be brief — the user is cooking, not sitting at a desk. Keep all spoken responses under 2 sentences unless they ask for more.
5. Acknowledge each ingredient the user mentions and confirm you've noted it.

Do NOT calculate exact calories — that's handled separately. Focus on balance, proportions, and cooking guidance. Sound like a knowledgeable friend in the kitchen, not a nutrition label.`

function buildSessionConfigJson(instructions) {
  return JSON.stringify({
    type: 'realtime',
    model: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-mini',
    instructions,
    audio: {
      input: {
        transcription: { model: 'gpt-4o-mini-transcribe' },
      },
      output: { voice: process.env.OPENAI_REALTIME_VOICE || 'marin' },
    },
  })
}

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
app.use(express.json({ limit: '128kb' }))
app.use(express.text({ type: ['application/sdp', 'text/plain'], limit: '256kb' }))

registerMealParse(app, () => OPENAI_API_KEY)

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

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

  const baseInstructions = process.env.BYTE_REALTIME_INSTRUCTIONS || DEFAULT_BYTE_INSTRUCTIONS
  const goalsHeader = req.get('X-Byte-Goals')?.trim()
  const instructions = goalsHeader
    ? `${baseInstructions}\n\n${goalsHeader}`
    : baseInstructions

  const sessionJson = buildSessionConfigJson(instructions)

  const fd = new FormData()
  fd.set('sdp', sdpOffer)
  fd.set('session', sessionJson)

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
  console.log(`  POST http://localhost:${PORT}/meal-parse`)
})
