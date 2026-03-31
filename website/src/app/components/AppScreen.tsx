interface AppScreenProps {
  type: 'dashboard' | 'meals' | 'progress' | 'goals';
}

export function AppScreen({ type }: AppScreenProps) {
  if (type === 'dashboard') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-gray-950 to-black p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-gray-400">Today</div>
          <div className="w-8 h-8 rounded-full bg-blue-500"></div>
        </div>

        {/* Calories remaining */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="12" />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="12"
                strokeDasharray="553"
                strokeDashoffset="138"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl text-white">1,247</div>
              <div className="text-gray-400 text-sm">remaining</div>
            </div>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-6 w-full">
            <div className="text-center">
              <div className="text-blue-400 text-2xl">45g</div>
              <div className="text-gray-500 text-xs">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-indigo-400 text-2xl">120g</div>
              <div className="text-gray-500 text-xs">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 text-2xl">38g</div>
              <div className="text-gray-500 text-xs">Fat</div>
            </div>
          </div>
        </div>

        {/* Bottom nav indicator */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <div className="w-2 h-2 rounded-full bg-white/20"></div>
          <div className="w-2 h-2 rounded-full bg-white/20"></div>
          <div className="w-2 h-2 rounded-full bg-white/20"></div>
        </div>
      </div>
    );
  }

  if (type === 'meals') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-gray-950 to-black p-6">
        <h2 className="text-white text-2xl mb-6">Today's Meals</h2>

        <div className="space-y-4">
          {/* Breakfast */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-white">Breakfast</div>
                <div className="text-gray-400 text-sm">Oatmeal & Berries</div>
              </div>
              <div className="text-blue-400">350 cal</div>
            </div>
          </div>

          {/* Lunch */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-white">Lunch</div>
                <div className="text-gray-400 text-sm">Chicken Salad</div>
              </div>
              <div className="text-blue-400">520 cal</div>
            </div>
          </div>

          {/* Snack */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-white">Snack</div>
                <div className="text-gray-400 text-sm">Protein Bar</div>
              </div>
              <div className="text-blue-400">180 cal</div>
            </div>
          </div>
        </div>

        {/* Add meal button */}
        <button className="w-full mt-6 py-4 rounded-2xl bg-blue-500 text-white">
          + Add Meal
        </button>
      </div>
    );
  }

  if (type === 'progress') {
    return (
      <div className="w-full h-full bg-gradient-to-b from-gray-950 to-black p-6">
        <h2 className="text-white text-2xl mb-6">Weekly Progress</h2>

        {/* Chart bars */}
        <div className="flex items-end justify-between h-48 mb-8">
          {[65, 80, 70, 90, 75, 85, 60].map((height, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className="w-8 rounded-t-lg bg-gradient-to-t from-blue-500 to-indigo-600"
                style={{ height: `${height}%` }}
              ></div>
              <div className="text-gray-500 text-xs">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Avg Daily Calories</div>
            <div className="text-white text-2xl">1,850</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Days on Track</div>
            <div className="text-white text-2xl">6 of 7</div>
          </div>
        </div>
      </div>
    );
  }

  // goals
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-950 to-black p-6">
      <h2 className="text-white text-2xl mb-6">Your Goals</h2>

      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-gray-400 text-sm mb-2">Daily Calorie Target</div>
          <div className="text-white text-3xl">2,100</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-gray-400 text-sm mb-2">Protein Goal</div>
          <div className="text-white text-3xl">150g</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-gray-400 text-sm mb-2">Weight Goal</div>
          <div className="text-white text-3xl">165 lbs</div>
        </div>
      </div>

      <button className="w-full mt-8 py-4 rounded-2xl border border-blue-500 text-blue-500">
        Edit Goals
      </button>
    </div>
  );
}
