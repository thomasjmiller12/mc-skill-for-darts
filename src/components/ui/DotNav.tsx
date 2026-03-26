"use client";

interface DotNavProps {
  sections: { id: string; label: string }[];
  activeId: string;
}

export default function DotNav({ sections, activeId }: DotNavProps) {
  return (
    <nav className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 xl:flex">
      {sections.map((s) => {
        const isActive = s.id === activeId;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-label={s.label}
            className="group relative flex items-center"
          >
            {/* Label tooltip */}
            <span className="absolute right-6 whitespace-nowrap rounded-md bg-white px-2 py-1 text-xs font-medium text-muted shadow-sm border border-gray-200 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {s.label}
            </span>
            {/* Dot */}
            <span
              className={`block h-2.5 w-2.5 rounded-full border transition-all duration-300 ${
                isActive
                  ? "scale-125 border-accent-blue bg-accent-blue"
                  : "border-gray-300 bg-transparent hover:border-gray-500"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}
