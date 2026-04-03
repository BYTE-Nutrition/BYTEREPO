import type { Goals, GoalPace, UserGoal, UserProfile, UserSex } from './types'

/**
 * Mifflin–St Jeor BMR (kcal/day). `prefer_not_say` averages male/female formulas.
 */
export function mifflinBmr(age: number, weightKg: number, heightCm: number, sex: UserSex): number {
  const a = Math.max(13, Math.min(100, age))
  const w = Math.max(30, Math.min(250, weightKg))
  const h = Math.max(120, Math.min(220, heightCm))
  const base = 10 * w + 6.25 * h - 5 * a
  if (sex === 'male') return base + 5
  if (sex === 'female') return base - 161
  return (base + 5 + base - 161) / 2
}

/** Map “how often you cook” to an activity factor on top of BMR. */
function activityFactorFromCooks(cooksPerWeek: number): number {
  const c = Math.max(0, Math.min(21, Math.round(cooksPerWeek)))
  if (c <= 2) return 1.375
  if (c <= 5) return 1.55
  if (c <= 9) return 1.65
  return 1.725
}

function paceDeltas(pace: GoalPace): { loss: number; gain: number; muscle: number } {
  switch (pace) {
    case 'gradual':
      return { loss: 280, gain: 280, muscle: 220 }
    case 'steady':
      return { loss: 450, gain: 400, muscle: 300 }
    case 'ambitious':
      return { loss: 600, gain: 520, muscle: 420 }
    default:
      return { loss: 450, gain: 400, muscle: 300 }
  }
}

/**
 * TDEE from BMR × activity, then macro split from goal + pace.
 */
export function computeGoalsFromProfile(profile: UserProfile): Goals {
  const { age, weightKg, heightCm, sex, cooksPerWeek, goal, goalPace } = profile
  const bmr = mifflinBmr(age, weightKg, heightCm, sex)
  const maintenance = Math.round(bmr * activityFactorFromCooks(cooksPerWeek))
  const { loss, gain, muscle } = paceDeltas(goalPace)

  let calorieGoal = maintenance
  let proteinCalorieFraction = 0.28

  switch (goal) {
    case 'weight_loss':
      calorieGoal = Math.round(maintenance - loss)
      proteinCalorieFraction = 0.34
      break
    case 'weight_gain':
      calorieGoal = Math.round(maintenance + gain)
      proteinCalorieFraction = 0.22
      break
    case 'muscle_gain':
      calorieGoal = Math.round(maintenance + muscle)
      proteinCalorieFraction = 0.36
      break
    case 'maintenance':
      proteinCalorieFraction = 0.26
      break
    case 'general_health':
      calorieGoal = Math.round(maintenance - Math.round(loss * 0.35))
      proteinCalorieFraction = 0.27
      break
    case 'cooking':
      calorieGoal = Math.round(maintenance - Math.round(loss * 0.28))
      proteinCalorieFraction = 0.24
      break
    default:
      break
  }

  calorieGoal = Math.max(1200, Math.min(4000, calorieGoal))

  const proteinGoal = Math.round((calorieGoal * proteinCalorieFraction) / 4)
  const fatCalorieFraction = goal === 'weight_loss' ? 0.3 : 0.28
  const fatGoal = Math.round((calorieGoal * fatCalorieFraction) / 9)
  const carbsCalories = Math.max(0, calorieGoal - proteinGoal * 4 - fatGoal * 9)
  const carbsGoal = Math.max(80, Math.round(carbsCalories / 4))

  return {
    calorieGoal,
    proteinGoal: Math.max(60, proteinGoal),
    carbsGoal,
    fatGoal: Math.max(40, fatGoal),
  }
}

export const USER_GOAL_OPTIONS: { id: UserGoal; label: string; hint: string }[] = [
  { id: 'weight_loss', label: 'Lose weight', hint: 'Moderate deficit, higher protein' },
  { id: 'weight_gain', label: 'Gain weight', hint: 'Calorie surplus' },
  { id: 'muscle_gain', label: 'Build muscle', hint: 'Surplus + high protein' },
  { id: 'maintenance', label: 'Stay steady', hint: 'Maintain current weight' },
  { id: 'cooking', label: 'Cook & log better', hint: 'Mindful portions, balanced macros' },
  { id: 'general_health', label: 'Feel healthier', hint: 'Balanced plate, sustainable habits' },
]

export const GOAL_PACE_OPTIONS: { id: GoalPace; label: string; hint: string }[] = [
  { id: 'gradual', label: 'Gradual', hint: 'Small shifts — easiest to sustain' },
  { id: 'steady', label: 'Steady', hint: 'Balanced pace most people choose' },
  { id: 'ambitious', label: 'Ambitious', hint: 'Stronger push — listen to your body' },
]
