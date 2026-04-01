import { ByteLogoMark } from './ByteLogoMark'

export function Navbar() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-neutral-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center py-1 transition-opacity hover:opacity-90">
          <ByteLogoMark />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-stone-300 hover:text-white transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-stone-300 hover:text-white transition-colors">
            How It Works
          </a>
        </div>

        <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-stone-200">
          Download
        </button>
      </div>
    </nav>
  );
}
