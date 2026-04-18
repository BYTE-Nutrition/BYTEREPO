/**
 * Meal transcript → structured items via OpenAI Chat Completions (same as api/meal-parse.js).
 * Env: OPENAI_API_KEY, OPENAI_MEAL_PARSE_MODEL (optional)
 */
import crypto from 'node:crypto'

const MAX_TRANSCRIPT = 8000

const PARSE_SYSTEM_PROMPT =
  'You are a nutrition data parser. Given a description of a meal or ingredients, return a JSON array of meal items with estimated nutritional data. Be accurate with quantities. Return only valid JSON, no explanation. Wrap the array in an object with key "items". Each item: id (string), name (string), amount (string), calories, protein, carbs, fat (numbers).'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

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

export const handler = async (event) => {
  const method = event.httpMethod || 'GET'

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: cors, body: '' }
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

  let body = event.body || '{}'
  if (event.isBase64Encoded && typeof body === 'string') {
    body = Buffer.from(body, 'base64').toString('utf8')
  }
  let parsedBody
  try {
    parsedBody = JSON.parse(body)
  } catch {
    return {
      statusCode: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  const transcript =
    parsedBody && typeof parsedBody.transcript === 'string' ? parsedBody.transcript.trim() : ''
  if (!transcript) {
    return {
      statusCode: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Expected JSON body with transcript string' }),
    }
  }
  if (transcript.length > MAX_TRANSCRIPT) {
    return {
      statusCode: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Transcript too long' }),
    }
  }

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
      return {
        statusCode: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: msg }),
      }
    }

    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return {
        statusCode: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid model response' }),
      }
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      return {
        statusCode: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Model returned non-JSON' }),
      }
    }

    const items = normalizeItems(parsed?.items)
    if (!items) {
      return {
        statusCode: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Model response missing items array' }),
      }
    }

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }
  } catch (e) {
    console.error('meal-parse function', e)
    return {
      statusCode: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e instanceof Error ? e.message : 'Meal parse failed' }),
    }
  }
}
