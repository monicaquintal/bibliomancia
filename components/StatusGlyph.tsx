import { statusTone } from "@/lib/status-colors";

const SYSTEM_KEYS = new Set(["quero", "tenho", "lendo", "lido", "abandonado"]);

export function StatusGlyph({
  statusKey,
  maskColor = "var(--paper)",
  className = "h-3.5 w-3.5",
}: {
  statusKey: string;
  maskColor?: string;
  className?: string;
}) {
  const color = statusTone(statusKey).dot;

  if (!SYSTEM_KEYS.has(statusKey)) {
    return (
      <svg viewBox="0 0 16 16" className={className} aria-hidden>
        <path
          d="M8 2 L9.2 6.8 L14 8 L9.2 9.2 L8 14 L6.8 9.2 L2 8 L6.8 6.8 Z"
          fill={color}
        />
      </svg>
    );
  }

  switch (statusKey) {
    case "quero":
      // Lua nova: só o contorno, ainda no escuro.
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden>
          <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeWidth="1.4" />
        </svg>
      );
    case "tenho":
      // Lua crescente: um fio de luz aparecendo.
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden>
          <circle cx="8" cy="8" r="6" fill={color} />
          <circle cx="11.2" cy="8" r="6.4" fill={maskColor} />
        </svg>
      );
    case "lendo":
      // Quarto crescente: metade iluminada, em andamento.
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden>
          <circle cx="8" cy="8" r="6" fill="none" stroke={color} strokeWidth="1.2" />
          <path d="M8 2a6 6 0 0 0 0 12z" fill={color} />
        </svg>
      );
    case "lido":
      // Lua cheia: completa.
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden>
          <circle cx="8" cy="8" r="6" fill={color} />
        </svg>
      );
    case "abandonado":
    default:
      // Eclipse: a luz foi encoberta fora do eixo das demais fases.
      return (
        <svg viewBox="0 0 16 16" className={className} aria-hidden>
          <circle cx="8" cy="8" r="6" fill={color} />
          <circle cx="8" cy="4.3" r="6.2" fill={maskColor} />
        </svg>
      );
  }
}
