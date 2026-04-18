/**
 * OpenAI Realtime WebRTC SDP relay (same contract as api/realtime/session.js).
 * Env: OPENAI_API_KEY (required), OPENAI_REALTIME_MODEL, OPENAI_REALTIME_VOICE, BYTE_REALTIME_INSTRUCTIONS
 */
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
      input: { transcription: { model: 'gpt-4o-mini-transcribe' } },
      output: { voice: process.env.OPENAI_REALTIME_VOICE || 'marin' },
    },
  })
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Byte-Goals',
}

function decodeBody(event) {
  let raw = event.body ?? ''
  if (event.isBase64Encoded && typeof raw === 'string') {
    raw = Buffer.from(raw, 'base64').toString('utf8')
  }
  return raw
}

function header(event, name) {
  const h = event.headers || {}
  const lower = name.toLowerCase()
  for (const [k, v] of Object.entries(h)) {
    if (k.toLowerCase() === lower) return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : ''
  }
  return ''
}

export const handler = async (event) => {
  const method = event.httpMethod || 'GET'

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' }
  }
  if (method === 'GET') {
    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' },
      body: 'byte-realtime-proxy: POST only.',
    }
  }
  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'OPENAI_API_KEY is not set' }),
    }
  }

  const sdpOffer = decodeBody(event)
  if (!sdpOffer.trim()) {
    return {
      statusCode: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Expected SDP offer body' }),
    }
  }

  const baseInstructions = process.env.BYTE_REALTIME_INSTRUCTIONS || DEFAULT_BYTE_INSTRUCTIONS
  const goalsHeader = header(event, 'x-byte-goals')?.trim()
  const instructions = goalsHeader ? `${baseInstructions}\n\n${goalsHeader}` : baseInstructions

  const fd = new FormData()
  fd.set('sdp', sdpOffer)
  fd.set('session', buildSessionConfigJson(instructions))

  try {
    const r = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: fd,
    })
    const text = await r.text()
    if (!r.ok) {
      console.error('OpenAI error', r.status, text.slice(0, 500))
      return {
        statusCode: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Upstream realtime session failed' }),
      }
    }
    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/sdp' },
      body: text,
    }
  } catch (e) {
    console.error('realtime-session function', e)
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create realtime session' }),
    }
  }
}
