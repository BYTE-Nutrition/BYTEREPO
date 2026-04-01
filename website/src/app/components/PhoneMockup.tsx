import { ImageWithFallback } from './figma/ImageWithFallback'

interface PhoneMockupProps {
  screenContent?: React.ReactNode
  rotation?: number
  scale?: number
  zIndex?: number
  glow?: boolean
}

export function PhoneMockup({
  screenContent,
  rotation = 0,
  scale = 1,
  zIndex = 0,
  glow = false,
}: PhoneMockupProps) {
  return (
    <div
      className="relative"
      style={{
        transform: `rotate(${rotation}deg) scale(${scale})`,
        zIndex,
      }}
    >
      {/* Titanium-style chassis + thin display bezel */}
      <div
        className={`relative h-[580px] w-[266px] rounded-[2.75rem] bg-gradient-to-b from-zinc-500 via-zinc-800 to-zinc-950 p-[2px] shadow-[0_28px_55px_-22px_rgba(0,0,0,0.85)] ring-1 ring-white/10 ${glow ? 'shadow-blue-950/35' : ''}`}
      >
        <div className="h-full w-full rounded-[2.68rem] bg-[#070708] p-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="relative h-full w-full overflow-hidden rounded-[2.52rem] bg-black">
            {/* Dynamic Island — compact; content uses pt below so nothing sits under it */}
            <div
              className="pointer-events-none absolute left-1/2 top-[7px] z-30 h-[21px] w-[64px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_2px_10px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.08]"
              aria-hidden
            />

            <div className="h-full w-full overflow-hidden pt-[34px]">
              {screenContent || (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=800&fit=crop"
                    alt="App screenshot"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side controls */}
        <div className="absolute -right-[2px] top-[112px] h-[72px] w-[2px] rounded-l-full bg-gradient-to-b from-zinc-400 to-zinc-700" />
        <div className="absolute -left-[2px] top-[102px] h-[30px] w-[2px] rounded-r-full bg-gradient-to-b from-zinc-400 to-zinc-700" />
        <div className="absolute -left-[2px] top-[148px] h-[54px] w-[2px] rounded-r-full bg-gradient-to-b from-zinc-400 to-zinc-700" />
        <div className="absolute -left-[2px] top-[214px] h-[54px] w-[2px] rounded-r-full bg-gradient-to-b from-zinc-400 to-zinc-700" />
      </div>

      {glow && <div className="absolute inset-0 -z-10 scale-[1.06] bg-blue-500/10 blur-3xl" />}
    </div>
  )
}
