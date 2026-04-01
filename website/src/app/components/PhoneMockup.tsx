import { ImageWithFallback } from './figma/ImageWithFallback';

interface PhoneMockupProps {
  screenContent?: React.ReactNode;
  rotation?: number;
  scale?: number;
  zIndex?: number;
  glow?: boolean;
}

export function PhoneMockup({
  screenContent,
  rotation = 0,
  scale = 1,
  zIndex = 0,
  glow = false
}: PhoneMockupProps) {
  return (
    <div
      className="relative"
      style={{
        transform: `rotate(${rotation}deg) scale(${scale})`,
        zIndex,
      }}
    >
      {/* Phone frame */}
      <div
        className={`relative h-[570px] w-[280px] rounded-[3rem] bg-gradient-to-br from-neutral-800 to-neutral-950 p-3 shadow-2xl ${glow ? 'shadow-blue-950/40' : ''}`}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-10"></div>

        {/* Screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-neutral-900 to-black">
          {screenContent || (
            <div className="w-full h-full flex items-center justify-center">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=800&fit=crop"
                alt="App screenshot"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Side buttons */}
        <div className="absolute right-0 top-24 w-1 h-12 bg-gray-700 rounded-l"></div>
        <div className="absolute right-0 top-40 w-1 h-16 bg-gray-700 rounded-l"></div>
      </div>

      {glow && (
        <div className="absolute inset-0 -z-10 scale-110 bg-blue-600/12 blur-3xl"></div>
      )}
    </div>
  );
}
