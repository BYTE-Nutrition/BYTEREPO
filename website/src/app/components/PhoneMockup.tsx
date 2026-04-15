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
      <div className={`relative w-[280px] h-[570px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl ${glow ? 'shadow-blue-500/20' : ''}`}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-10"></div>

        {/* Screen */}
        <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black rounded-[2.5rem] overflow-hidden relative">
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
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl -z-10 scale-110"></div>
      )}
    </div>
  );
}
