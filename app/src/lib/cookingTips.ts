import type { MealItem } from '@/lib/types'

type Rule = { match: RegExp; tips: string[] }

const RULES: Rule[] = [
  {
    match: /\b(chicken|poultry|turkey|duck)\b/i,
    tips: [
      'Poultry: 165°F internal.',
      'Rest chicken 3–5 min.',
    ],
  },
  {
    match: /\b(beef|steak|burger|ground beef)\b/i,
    tips: [
      'Burgers: 160°F.',
      'Pull steak a few °F early; carryover finishes.',
    ],
  },
  {
    match: /\b(pork|bacon|ham|sausage)\b/i,
    tips: [
      'Pork: 145°F + short rest.',
      'Bacon: start cold pan, medium heat.',
    ],
  },
  {
    match: /\b(fish|salmon|tuna|cod|shrimp|seafood)\b/i,
    tips: [
      'Fish: cook just until opaque.',
      'Pat seafood dry before searing.',
    ],
  },
  {
    match: /\b(egg|eggs|omelet|scramble)\b/i,
    tips: [
      'Eggs: firm whites + yolks for safety.',
      'Low heat = creamy scrambles.',
    ],
  },
  {
    match: /\b(rice)\b/i,
    tips: [
      'Rinse rice until water runs clear.',
      'Rest covered 5–10 min off heat.',
    ],
  },
  {
    match: /\b(pasta|noodle|spaghetti|penne)\b/i,
    tips: [
      'Salt pasta water like seawater.',
      'Save starchy water for sauces.',
    ],
  },
  {
    match: /\b(potato|potatoes|fries|mashed)\b/i,
    tips: [
      'Start potatoes in cold water.',
      'Parboil + rough edges = crispy roast.',
    ],
  },
  {
    match: /\b(onion|garlic|shallot)\b/i,
    tips: [
      'Add garlic after onions soften.',
      'Salt onions to caramelize evenly.',
    ],
  },
  {
    match: /\b(salad|lettuce|spinach|kale|greens|arugula)\b/i,
    tips: [
      'Spin greens dry so dressing sticks.',
      'Add delicate greens last.',
    ],
  },
  {
    match: /\b(oil|fry|fried|deep fry|sauté|saute)\b/i,
    tips: [
      'Pat dry before frying.',
      'Don’t crowd the pan.',
    ],
  },
]

const DEFAULT_TIPS = [
  'Mise en place before high heat.',
  'Season in layers—salt early.',
  'Keep a damp + dry towel handy.',
]

function corpus(items: MealItem[], transcript: string): string {
  const fromItems = items.map((i) => `${i.name} ${i.amount}`).join(' ')
  return `${fromItems} ${transcript}`.toLowerCase()
}

/**
 * Short, real-time cooking guidance derived from parsed ingredients and what the user said.
 */
export function getCookingTips(items: MealItem[], transcript: string): string[] {
  const text = corpus(items, transcript)
  if (!text.trim()) {
    return [
      'Say what you’re cooking for live tips.',
      'Mention proteins, sides, and method.',
    ]
  }

  const out: string[] = []
  const seen = new Set<string>()

  for (const rule of RULES) {
    if (rule.match.test(text)) {
      for (const t of rule.tips) {
        if (!seen.has(t)) {
          seen.add(t)
          out.push(t)
        }
      }
    }
  }

  if (out.length === 0) {
    return DEFAULT_TIPS.slice(0, 3)
  }

  // Cap length for UI; prefer variety
  return out.slice(0, 4)
}
