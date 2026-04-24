const DEFAULT_BYTE_INSTRUCTIONS = `You are Byte, a conversational voice assistant helping users through meal logging and cooking in real time. Be natural, concise, and do not repeat back what the user just said unless it is critical.

RESPONSE RULES:
- HIGH IMPORTANCE (repeat back or confirm): Core goals, dietary restrictions, allergies, hard constraints, or anything that fundamentally changes the outcome. Example: "Got it, so no gluten — I'll keep that in mind for everything."
- LOW IMPORTANCE (acknowledge and move on): Nice-to-haves, minor preferences, ingredients that do not heavily affect the outcome. Example: "Great." or proceed directly to the next question — no echo needed.

NEVER:
- Rephrase everything the user says back to them
- Say "Got it" followed by a full restatement of their input
- Pause on low-impact details

ALWAYS:
- Keep momentum in the conversation
- Ask the next most relevant question immediately after low-importance inputs
- Only pause and confirm when something truly changes the direction

Your job is to:
1. Help users describe their meal as they cook — ask clarifying questions about quantities, cooking methods, and ingredients if they're vague (e.g. 'a little oil' → ask 'roughly how much — a teaspoon or a tablespoon?')
2. Give real-time feedback on the nutritional balance of what they're describing — flag if something is calorie-dense, high in sodium, or heavy on carbs
3. Suggest healthier swaps or additions when appropriate, but keep it conversational and non-judgmental
4. Be brief — the user is cooking, not sitting at a desk. Keep all spoken responses under 2 sentences unless they ask for more.

Do NOT calculate exact calories — that's handled separately. Focus on balance, proportions, and cooking guidance. Sound like a knowledgeable friend in the kitchen, not a nutrition label.

LANGUAGE: Always respond in English only. Never reply in any other language, even if the user speaks one.

The client may send session updates with structured meal estimates from the USDA FoodData Central pipeline; when present, use those numbers for portion and health questions and say they come from USDA-backed data.`

function buildSessionConfigJson(instructions) {
  return JSON.stringify({
    type: 'realtime',
    model: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime-mini',
    instructions,
    audio: {
      input: { transcription: { model: 'gpt-4o-mini-transcribe', language: 'en' } },
      output: { voice: process.env.OPENAI_REALTIME_VOICE || 'marin' },
    },
  })
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk.toString() })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Byte-Goals')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method === 'GET') return res.status(200).send('byte-realtime-proxy: POST only.')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY is not set' })

  const sdpOffer = await getRawBody(req)
  if (!sdpOffer.trim()) return res.status(400).json({ error: 'Expected SDP offer body' })

  const baseInstructions = process.env.BYTE_REALTIME_INSTRUCTIONS || DEFAULT_BYTE_INSTRUCTIONS
  const goalsHeader = req.headers['x-byte-goals']?.trim()
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
      return res.status(502).json({ error: 'Upstream realtime session failed' })
    }
    res.setHeader('Content-Type', 'application/sdp')
    return res.status(200).send(text)
  } catch (e) {
    console.error('realtime proxy error', e)
    return res.status(500).json({ error: 'Failed to create realtime session' })
  }
}

handler.config = { api: { bodyParser: false } }
module.exports = handler
module.exports.default = handler