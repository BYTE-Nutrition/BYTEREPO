import type { Goals, UserGoal } from './types'

/** Rough maintenance estimate by age when height/weight are unknown (average adult baseline). */
function ageAdjustedMaintenance(age: number): number {
  if (age < 22) return 2250
  if (age < 35) return 2150
  if (age < 50) return 2050
  if (age < 65) return 1950
  return 1850
}

/**
 * Derive macro targets from age + primary goal (no height/weight — conservative defaults).
 * Protein emphasis scales with goal; calories shift for loss/gain.
 */
export function computeGoalsFromProfile(age: number, goal: UserGoal): Goals {
  const maintenance = ageAdjustedMaintenance(age)
  let calorieGoal = maintenance
  let proteinCalorieFraction = 0.28

  switch (goal) {
    case 'weight_loss':
      calorieGoal = Math.round(maintenance - 450)
      proteinCalorieFraction = 0.34
      break
    case 'weight_gain':
      calorieGoal = Math.round(maintenance + 350)
      proteinCalorieFraction = 0.22
      break
    case 'muscle_gain':
      calorieGoal = Math.round(maintenance + 280)
      proteinCalorieFraction = 0.36
      break
    case 'maintenance':
      proteinCalorieFraction = 0.26
      break
    case 'general_health':
      calorieGoal = Math.round(maintenance - 50)
      proteinCalorieFraction = 0.27
      break
    case 'cooking':
      calorieGoal = Math.round(maintenance - 120)
      proteinCalorieFraction = 0.24
      break
    default:
      break
  }

  calorieGoal = Math.max(1200, Math.min(3800, calorieGoal))

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
