interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
}

export function TestimonialCard({ quote, author, role }: TestimonialCardProps) {
  return (
    <div className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300">
      <div className="mb-6">
        <svg className="h-10 w-10 text-blue-500/30" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>

      <p className="text-white text-lg mb-6 leading-relaxed">"{quote}"</p>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-800 to-indigo-950 ring-1 ring-blue-500/20"></div>
        <div>
          <div className="font-medium text-white">{author}</div>
          <div className="text-sm text-stone-400">{role}</div>
        </div>
      </div>
    </div>
  );
}
