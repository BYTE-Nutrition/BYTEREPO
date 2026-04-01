interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.05]">
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04]">
          {icon}
        </div>

        <h3 className="mb-2 text-xl text-white">{title}</h3>
        <p className="leading-relaxed text-stone-400">{description}</p>
      </div>
    </div>
  );
}
