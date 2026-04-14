import type { MealItem } from './types'
import { totalsFromMealItems } from './aggregate'

interface FoodEntry {
  name: string
  amount: string
  calories: number
  protein: number
  carbs: number
  fat: number
  /** lowercase phrases to match in user text */
  keys: string[]
}

const FOODS: FoodEntry[] = [
  {
    name: 'Grilled chicken breast',
    amount: '200g',
    calories: 330,
    protein: 62,
    carbs: 0,
    fat: 7,
    keys: ['chicken breast', 'grilled chicken', 'chicken'],
  },
  {
    name: 'Salmon (grilled)',
    amount: '170g fillet',
    calories: 350,
    protein: 34,
    carbs: 0,
    fat: 22,
    keys: ['salmon', 'grilled salmon'],
  },
  {
    name: 'Quinoa (cooked)',
    amount: '1/2 cup (93g)',
    calories: 111,
    protein: 4,
    carbs: 20,
    fat: 2,
    keys: ['quinoa'],
  },
  {
    name: 'Brown rice (cooked)',
    amount: '1 cup',
    calories: 216,
    protein: 5,
    carbs: 45,
    fat: 2,
    keys: ['brown rice', 'rice'],
  },
  {
    name: 'White rice (cooked)',
    amount: '1 cup',
    calories: 206,
    protein: 4,
    carbs: 45,
    fat: 0,
    keys: ['white rice'],
  },
  {
    name: 'Mixed greens',
    amount: '2 cups',
    calories: 18,
    protein: 1,
    carbs: 3,
    fat: 0,
    keys: ['mixed greens', 'mixed salad', 'salad', 'lettuce', 'green salad'],
  },
  {
    name: 'Cherry tomatoes',
    amount: '1 cup',
    calories: 27,
    protein: 1,
    carbs: 6,
    fat: 0,
    keys: ['cherry tomatoes', 'tomato', 'tomatoes'],
  },
  {
    name: 'Olive oil dressing',
    amount: '2 tbsp',
    calories: 194,
    protein: 0,
    carbs: 0,
    fat: 22,
    keys: ['olive oil', 'dressing', 'vinaigrette'],
  },
  {
    name: 'Oatmeal',
    amount: '1 cup cooked',
    calories: 166,
    protein: 6,
    carbs: 28,
    fat: 3,
    keys: ['oatmeal', 'oats', 'porridge'],
  },
  {
    name: 'Blueberries',
    amount: '1/2 cup',
    calories: 42,
    protein: 1,
    carbs: 11,
    fat: 0,
    keys: ['blueberries', 'berry', 'berries'],
  },
  {
    name: 'Greek yogurt',
    amount: '150g plain',
    calories: 100,
    protein: 17,
    carbs: 6,
    fat: 0,
    keys: ['greek yogurt', 'yogurt'],
  },
  {
    name: 'Protein shake',
    amount: '12 oz',
    calories: 180,
    protein: 30,
    carbs: 8,
    fat: 3,
    keys: ['protein shake', 'shake'],
  },
  {
    name: 'Banana',
    amount: '1 medium',
    calories: 105,
    protein: 1,
    carbs: 27,
    fat: 0,
    keys: ['banana'],
  },
  {
    name: 'Apple',
    amount: '1 medium',
    calories: 95,
    protein: 0,
    carbs: 25,
    fat: 0,
    keys: ['apple'],
  },
  {
    name: 'Almonds',
    amount: '23g (about 15)',
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    keys: ['almonds', 'almond'],
  },
  {
    name: 'Egg (large)',
    amount: '2 eggs',
    calories: 156,
    protein: 12,
    carbs: 1,
    fat: 11,
    keys: ['eggs', 'egg', 'scrambled eggs'],
  },
  {
    name: 'Avocado',
    amount: '1/2 medium',
    calories: 120,
    protein: 2,
    carbs: 6,
    fat: 11,
    keys: ['avocado'],
  },
  {
    name: 'Whole wheat bread',
    amount: '2 slices',
    calories: 160,
    protein: 8,
    carbs: 28,
    fat: 2,
    keys: ['toast', 'bread', 'sandwich bread'],
  },
  {
    name: 'Turkey breast',
    amount: '100g',
    calories: 135,
    protein: 30,
    carbs: 0,
    fat: 1,
    keys: ['turkey'],
  },
  {
    name: 'Tuna (canned in water)',
    amount: '1 can',
    calories: 150,
    protein: 33,
    carbs: 0,
    fat: 1,
    keys: ['tuna'],
  },
  {
    name: 'Pasta (cooked)',
    amount: '1 cup',
    calories: 220,
    protein: 8,
    carbs: 43,
    fat: 1,
    keys: ['pasta', 'spaghetti', 'penne'],
  },
  {
    name: 'Marinara sauce',
    amount: '1/2 cup',
    calories: 70,
    protein: 2,
    carbs: 10,
    fat: 2,
    keys: ['marinara', 'tomato sauce', 'pasta sauce'],
  },
  {
    name: 'Steak (lean)',
    amount: '200g',
    calories: 420,
    protein: 48,
    carbs: 0,
    fat: 24,
    keys: ['steak', 'beef'],
  },
  {
    name: 'Sweet potato',
    amount: '1 medium',
    calories: 112,
    protein: 2,
    carbs: 26,
    fat: 0,
    keys: ['sweet potato'],
  },
  {
    name: 'Broccoli',
    amount: '1 cup',
    calories: 55,
    protein: 4,
    carbs: 11,
    fat: 1,
    keys: ['broccoli'],
  },
  {
    name: 'Green beans',
    amount: '1 cup',
    calories: 44,
    protein: 2,
    carbs: 10,
    fat: 0,
    keys: ['green beans', 'string beans', 'haricots verts'],
  },
  {
    name: 'Lentil soup',
    amount: '1 cup',
    calories: 186,
    protein: 12,
    carbs: 30,
    fat: 3,
    keys: ['lentil soup', 'lentils soup'],
  },
  {
    name: 'Grapes',
    amount: '1 handful (~15)',
    calories: 34,
    protein: 0,
    carbs: 9,
    fat: 0,
    keys: ['grapes', 'handful of grapes', 'red grapes', 'green grapes'],
  },
  {
    name: 'Cheddar cheese',
    amount: '28g',
    calories: 113,
    protein: 7,
    carbs: 0,
    fat: 9,
    keys: ['cheddar', 'cheese'],
  },
  {
    name: 'Hummus',
    amount: '1/4 cup',
    calories: 100,
    protein: 5,
    carbs: 9,
    fat: 6,
    keys: ['hummus'],
  },
  {
    name: 'Chicken salad',
    amount: '1 serving (est.)',
    calories: 380,
    protein: 28,
    carbs: 12,
    fat: 24,
    keys: ['chicken salad'],
  },
  {
    name: 'Caesar salad',
    amount: '1 serving (est.)',
    calories: 470,
    protein: 18,
    carbs: 20,
    fat: 38,
    keys: ['caesar salad', 'caesar'],
  },
  {
    name: 'Burrito bowl',
    amount: '1 bowl (est.)',
    calories: 650,
    protein: 35,
    carbs: 70,
    fat: 24,
    keys: ['burrito bowl', 'chipotle'],
  },
  {
    name: 'Sushi roll (avg.)',
    amount: '8 pieces',
    calories: 300,
    protein: 12,
    carbs: 45,
    fat: 8,
    keys: ['sushi', 'roll'],
  },
  {
    name: 'Pizza slice',
    amount: '1 large slice',
    calories: 320,
    protein: 14,
    carbs: 36,
    fat: 12,
    keys: ['pizza'],
  },
  {
    name: 'Burger',
    amount: '1 sandwich',
    calories: 540,
    protein: 28,
    carbs: 40,
    fat: 30,
    keys: ['burger', 'hamburger'],
  },
  {
    name: 'French fries',
    amount: 'medium',
    calories: 380,
    protein: 4,
    carbs: 48,
    fat: 18,
    keys: ['fries', 'french fries'],
  },
  {
    name: 'Latte (2% milk)',
    amount: '16 oz',
    calories: 190,
    protein: 13,
    carbs: 19,
    fat: 7,
    keys: ['latte', 'coffee'],
  },
  {
    name: 'Black coffee',
    amount: '12 oz',
    calories: 5,
    protein: 0,
    carbs: 0,
    fat: 0,
    keys: ['black coffee'],
  },
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s'/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitPhrases(text: string): string[] {
  const n = normalize(text)
  if (!n) return []
  const rough = n.split(/\b(?:and|with|plus|along|alongside)\b|,/g)
  return rough.map((p) => p.trim()).filter(Boolean)
}

function bestMatch(segment: string): FoodEntry | null {
  let best: { entry: FoodEntry; score: number } | null = null
  for (const f of FOODS) {
    for (const k of f.keys) {
      if (segment.includes(k)) {
        const score = k.length
        if (!best || score > best.score) best = { entry: f, score }
      }
    }
  }
  return best?.entry ?? null
}

function mealItemFromFood(f: FoodEntry): MealItem {
  return {
    id: crypto.randomUUID(),
    name: f.name,
    amount: f.amount,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    nutritionSource: 'estimate',
  }
}

function fallbackMeal(text: string): MealItem[] {
  const words = normalize(text).split(/\s+/).filter(Boolean).length
  const scale = Math.min(1.4, Math.max(0.6, 0.35 + words * 0.04))
  const base = 420
  const c = Math.round(base * scale)
  return [
    {
      id: crypto.randomUUID(),
      name: 'Logged meal (estimate)',
      amount: 'From your description',
      calories: c,
      protein: Math.round(c * 0.25 / 4),
      carbs: Math.round(c * 0.45 / 4),
      fat: Math.round(c * 0.3 / 9),
      nutritionSource: 'estimate',
    },
  ]
}

export function parseMealFromTranscript(raw: string): MealItem[] {
  const segments = splitPhrases(raw)
  if (segments.length === 0) return []

  const used = new Set<FoodEntry>()
  const items: MealItem[] = []

  for (const seg of segments) {
    const m = bestMatch(seg)
    if (m && !used.has(m)) {
      used.add(m)
      items.push(mealItemFromFood(m))
    }
  }

  if (items.length === 0) {
    const whole = bestMatch(normalize(raw))
    if (whole) return [mealItemFromFood(whole)]
    return fallbackMeal(raw)
  }

  return items
}

export function sumMealItems(items: MealItem[]) {
  return totalsFromMealItems(items)
}

export const QUICK_SUGGESTIONS = [
  'Chicken salad with quinoa',
  'Grilled salmon with vegetables',
  'Protein shake with banana',
  'Greek yogurt with berries',
]
