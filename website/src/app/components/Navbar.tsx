import { ByteLogoMark } from './ByteLogoMark'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center py-1 transition-opacity hover:opacity-90">
          <ByteLogoMark />
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-stone-300 hover:text-white transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-stone-300 hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="text-stone-300 hover:text-white transition-colors">
            Pricing
          </a>
        </div>

        <button className="rounded-xl bg-neutral-950 px-5 py-2.5 text-white shadow-lg shadow-black/25 ring-1 ring-white/10 transition-all hover:bg-black hover:shadow-black/40">
          Download
        </button>
      </div>
    </nav>
  );
}
