import crypto from 'node:crypto'

const MAX_TRANSCRIPT = 8000

const PARSE_SYSTEM_PROMPT =
  'You are a nutrition data parser. Given a description of a meal or ingredients, return a JSON array of meal items with estimated nutritional data. Be accurate with quantities. Return only valid JSON, no explanation. Wrap the array in an object with key "items". Each item: id (string), name (string), amount (string), calories, protein, carbs, fat (numbers).'

function isMealItemShape(x) {
  return (
    x &&
    typeof x === 'object' &&
    typeof x.name === 'string' &&
    typeof x.amount === 'string' &&
    typeof x.calories === 'number' &&
    typeof x.protein === 'number' &&
    typeof x.carbs === 'number' &&
    typeof x.fat === 'number'
  )
}

function normalizeItems(raw) {
  if (!Array.isArray(raw)) return null
  const out = []
  for (const row of raw) {
    if (!isMealItemShape(row)) continue
    out.push({
      id: typeof row.id === 'string' && row.id.trim() ? row.id.trim() : crypto.randomUUID(),
      name: row.name.trim(),
      amount: row.amount.trim(),
      calories: Math.max(0, Math.round(row.calories)),
      protein: Math.max(0, Math.round(row.protein)),
      carbs: Math.max(0, Math.round(row.carbs)),
      fat: Math.max(0, Math.round(row.fat)),
    })
  }
  return out
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not set' })
  }

  const transcript =
    req.body && typeof req.body.transcript === 'string' ? req.body.transcript.trim() : ''
  if (!transcript) return res.status(400).json({ error: 'Expected JSON body with transcript string' })
  if (transcript.length > MAX_TRANSCRIPT) return res.status(400).json({ error: 'Transcript too long' })

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MEAL_PARSE_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PARSE_SYSTEM_PROMPT },
          { role: 'user', content: `Parse this meal description into items:\n\n${transcript}` },
        ],
        temperature: 0.2,
      }),
    })

    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      const msg = typeof data?.error?.message === 'string' ? data.error.message : 'OpenAI meal parse failed'
      return res.status(500).json({ error: msg })
    }

    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') return res.status(500).json({ error: 'Invalid model response' })

    let parsed
    try { parsed = JSON.parse(content) } catch { return res.status(500).json({ error: 'Model returned non-JSON' }) }

    const items = normalizeItems(parsed?.items)
    if (!items) return res.status(500).json({ error: 'Model response missing items array' })

    return res.json({ items })
  } catch (e) {
    console.error('meal-parse', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Meal parse failed' })
  }
}