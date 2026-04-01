import type { MealItem } from '@/lib/types'

type Rule = { match: RegExp; tips: string[] }

const RULES: Rule[] = [
  {
    match: /\b(chicken|poultry|turkey|duck)\b/i,
    tips: [
      'Cook poultry to 165°F (74°C) in the thickest part—use a thermometer.',
      'Let chicken rest 3–5 minutes after cooking so juices settle.',
    ],
  },
  {
    match: /\b(beef|steak|burger|ground beef)\b/i,
    tips: [
      'Burgers and ground beef: aim for 160°F (71°C) unless you trust the source for rarer cooks.',
      'Steaks: pull a few degrees before your target; carryover heat finishes the cook.',
    ],
  },
  {
    match: /\b(pork|bacon|ham|sausage)\b/i,
    tips: [
      'Cook fresh pork to 145°F (63°C) with a short rest unless a recipe calls otherwise.',
      'Bacon crisps best from a cold pan or medium heat—watch splatter.',
    ],
  },
  {
    match: /\b(fish|salmon|tuna|cod|shrimp|seafood)\b/i,
    tips: [
      'Fish often needs just until opaque and flaky—overcooking dries it out fast.',
      'Pat seafood dry before searing for a better crust.',
    ],
  },
  {
    match: /\b(egg|eggs|omelet|scramble)\b/i,
    tips: [
      'For food safety, cook eggs until whites and yolks are firm unless you accept raw risk.',
      'Low, slow heat keeps scrambled eggs creamy instead of rubbery.',
    ],
  },
  {
    match: /\b(rice)\b/i,
    tips: [
      'Rinse rice until the water runs mostly clear for fluffier, less gummy grains.',
      'After cooking, rest covered 5–10 minutes off heat—don’t peek early.',
    ],
  },
  {
    match: /\b(pasta|noodle|spaghetti|penne)\b/i,
    tips: [
      'Salt the pasta water; it should taste like mild seawater.',
      'Save a mug of starchy pasta water to loosen or bind sauces.',
    ],
  },
  {
    match: /\b(potato|potatoes|fries|mashed)\b/i,
    tips: [
      'Start potatoes in cold water for even cooking when boiling.',
      'For crispy roast potatoes, parboil, rough up the edges, then hot oil.',
    ],
  },
  {
    match: /\b(onion|garlic|shallot)\b/i,
    tips: [
      'Garlic burns quickly—add it after onions soften or use lower heat.',
      'A pinch of salt helps onions release moisture and caramelize evenly.',
    ],
  },
  {
    match: /\b(salad|lettuce|spinach|kale|greens|arugula)\b/i,
    tips: [
      'Wash leafy greens well; spin or pat very dry so dressing sticks.',
      'Add delicate greens at the end so they don’t wilt into mush.',
    ],
  },
  {
    match: /\b(oil|fry|fried|deep fry|sauté|saute)\b/i,
    tips: [
      'Pat ingredients dry before frying—less water means less splatter and better browning.',
      'Don’t overcrowd the pan; it drops the temperature and steams instead of sears.',
    ],
  },
]

const DEFAULT_TIPS = [
  'Prep ingredients (mise en place) before anything hits high heat.',
  'Taste and season in layers—salt early, adjust acid/fat at the end.',
  'Keep a damp towel nearby for quick wipe-downs and a dry one for hot handles.',
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
      'Say what you’re cooking—we’ll surface timing and safety tips as ingredients appear.',
      'Mention proteins, sides, and how you’re cooking (grill, pan, oven) for better hints.',
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
