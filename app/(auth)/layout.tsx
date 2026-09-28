import { ThemeToggle } from "@/components/ThemeToggle";

function OpenBookMark() {
  return (
    <svg viewBox="0 0 72 48" className="h-10 w-16" aria-hidden>
      <g className="text-night/60" fill="none" stroke="currentColor" strokeWidth="0.75">
        <path d="M11 7 L36 4 L61 9" />
      </g>
      <g className="text-marigold" fill="currentColor">
        <circle cx="11" cy="7" r="1.3" />
        <circle cx="36" cy="4" r="1.6" />
        <circle cx="61" cy="9" r="1.3" />
        <circle cx="6" cy="30" r="1" />
        <circle cx="66" cy="32" r="1" />
      </g>
      <g
        transform="translate(12,8)"
        className="text-cover"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      >
        <path d="M24 6.5c-3.2-2.6-7.6-4-12.5-4C7.9 2.5 5 3.1 3 4v21c2-.9 4.9-1.5 8.5-1.5 4.9 0 9.3 1.4 12.5 4 3.2-2.6 7.6-4 12.5-4 3.6 0 6.5.6 8.5 1.5V4c-2-.9-4.9-1.5-8.5-1.5-4.9 0-9.3 1.4-12.5 4z" />
        <path d="M24 6.5v21" />
      </g>
    </svg>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="main-content" className="relative flex flex-1 items-center justify-center px-4 py-16">
      <ThemeToggle className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-dust-line text-ink-soft transition-colors hover:text-ink" />
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <OpenBookMark />
        </div>
        {children}
      </div>
    </div>
  );
}
