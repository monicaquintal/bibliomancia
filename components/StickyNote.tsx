// Bilhetinho de mão, levemente torto, para dicas e telas vazias.
export function StickyNote({
  children,
  tilt = "-rotate-2",
  className = "",
}: {
  children: React.ReactNode;
  tilt?: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-block max-w-md ${tilt} rounded-sm bg-note px-4 py-3 font-hand text-xl leading-snug text-note-ink shadow-[2px_3px_0_rgba(0,0,0,0.12)] ${className}`}
    >
      {children}
    </div>
  );
}
