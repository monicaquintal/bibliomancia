export type StatusTone = {
  fg: string;
  bg: string;
  dot: string;
};

const TONES: Record<string, StatusTone> = {
  quero: { fg: "var(--night)", bg: "color-mix(in srgb, var(--night) 16%, transparent)", dot: "var(--night)" },
  tenho: { fg: "var(--dust)", bg: "color-mix(in srgb, var(--dust) 20%, transparent)", dot: "var(--dust)" },
  lendo: { fg: "var(--cover)", bg: "color-mix(in srgb, var(--cover) 16%, transparent)", dot: "var(--cover)" },
  lido: { fg: "var(--marigold-dark)", bg: "color-mix(in srgb, var(--marigold) 22%, transparent)", dot: "var(--marigold)" },
  abandonado: { fg: "var(--berry)", bg: "color-mix(in srgb, var(--berry) 16%, transparent)", dot: "var(--berry)" },
};

const FALLBACK: StatusTone = {
  fg: "var(--ink-soft)",
  bg: "color-mix(in srgb, var(--dust) 18%, transparent)",
  dot: "var(--dust)",
};

export function statusTone(key: string): StatusTone {
  return TONES[key] ?? FALLBACK;
}
