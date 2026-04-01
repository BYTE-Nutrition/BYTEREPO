interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 p-8 transition-all duration-300 hover:border-blue-500/35 hover:shadow-xl hover:shadow-blue-950/25">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-blue-500/0 to-blue-600/8 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

      <div className="relative z-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-600/30 bg-gradient-to-br from-blue-950/50 to-indigo-950/40">
          {icon}
        </div>

        <h3 className="mb-2 text-xl text-white">{title}</h3>
        <p className="leading-relaxed text-stone-400">{description}</p>
      </div>
    </div>
  );
}
