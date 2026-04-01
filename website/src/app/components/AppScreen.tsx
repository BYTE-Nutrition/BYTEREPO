interface AppScreenProps {
  type: 'dashboard' | 'meals' | 'progress' | 'goals';
}

export function AppScreen({ type }: AppScreenProps) {
  if (type === 'dashboard') {
    return (
      <div className="flex h-full w-full flex-col bg-gradient-to-b from-neutral-950 to-black p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-stone-400">Today</div>
          <div className="h-8 w-8 rounded-full bg-blue-600 ring-2 ring-blue-400/25"></div>
        </div>

        {/* Calories remaining */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative mb-6 h-48 w-48">
            <svg className="h-full w-full -rotate-90 transform">
              <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(96, 165, 250, 0.14)" strokeWidth="12" />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="rgb(96, 165, 250)"
                strokeWidth="12"
                strokeDasharray="553"
                strokeDashoffset="138"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl text-white">1,247</div>
              <div className="text-sm text-stone-400">remaining</div>
            </div>
          </div>

          {/* Macros — cool blue family */}
          <div className="grid w-full grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl text-sky-300">45g</div>
              <div className="text-xs text-stone-500">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-blue-300">120g</div>
              <div className="text-xs text-stone-500">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-indigo-300">38g</div>
              <div className="text-xs text-stone-500">Fat</div>
            </div>
          </div>
        </div>

        {/* Bottom nav indicator */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-400"></div>
          <div className="h-2 w-2 rounded-full bg-white/20"></div>
          <div className="h-2 w-2 rounded-full bg-white/20"></div>
          <div className="h-2 w-2 rounded-full bg-white/20"></div>
        </div>
      </div>
    );
  }

  if (type === 'meals') {
    return (
      <div className="h-full w-full bg-gradient-to-b from-neutral-950 to-black p-6">
        <h2 className="mb-6 text-2xl text-white">Today's Meals</h2>

        <div className="space-y-4">
          {/* Breakfast */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-white">Breakfast</div>
                <div className="text-sm text-stone-400">Oatmeal & Berries</div>
              </div>
              <div className="text-blue-300">350 cal</div>
            </div>
          </div>

          {/* Lunch */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-white">Lunch</div>
                <div className="text-sm text-stone-400">Chicken Salad</div>
              </div>
              <div className="text-blue-300">520 cal</div>
            </div>
          </div>

          {/* Snack */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="text-white">Snack</div>
                <div className="text-sm text-stone-400">Protein Bar</div>
              </div>
              <div className="text-blue-300">180 cal</div>
            </div>
          </div>
        </div>

        {/* Add meal button */}
        <button className="mt-6 w-full rounded-2xl bg-neutral-950 py-4 text-white shadow-lg shadow-black/30 ring-1 ring-white/10">
          + Add Meal
        </button>
      </div>
    );
  }

  if (type === 'progress') {
    return (
      <div className="h-full w-full bg-gradient-to-b from-neutral-950 to-black p-6">
        <h2 className="mb-6 text-2xl text-white">Weekly Progress</h2>

        {/* Chart bars */}
        <div className="mb-8 flex h-48 items-end justify-between">
          {[65, 80, 70, 90, 75, 85, 60].map((height, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className="w-8 rounded-t-lg bg-gradient-to-t from-blue-900 to-blue-500"
                style={{ height: `${height}%` }}
              ></div>
              <div className="text-xs text-stone-500">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-1 text-sm text-stone-400">Avg Daily Calories</div>
            <div className="text-2xl text-white">1,850</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-1 text-sm text-stone-400">Days on Track</div>
            <div className="text-2xl text-white">6 of 7</div>
          </div>
        </div>
      </div>
    );
  }

  // goals
  return (
    <div className="h-full w-full bg-gradient-to-b from-neutral-950 to-black p-6">
      <h2 className="mb-6 text-2xl text-white">Your Goals</h2>

      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm text-stone-400">Daily Calorie Target</div>
          <div className="text-3xl text-white">2,100</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm text-stone-400">Protein Goal</div>
          <div className="text-3xl text-white">150g</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm text-stone-400">Weight Goal</div>
          <div className="text-3xl text-white">165 lbs</div>
        </div>
      </div>

      <button className="mt-8 w-full rounded-2xl border border-blue-500/45 py-4 text-blue-200 transition-colors hover:border-blue-400 hover:bg-blue-500/10">
        Edit Goals
      </button>
    </div>
  );
}
