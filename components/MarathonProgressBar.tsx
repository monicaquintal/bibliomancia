import type { MarathonProgress } from "@/lib/marathons";

const PHASE_LABEL = { aberta: "Em andamento", futura: "Ainda não começou", encerrada: "Encerrada" };

export function MarathonProgressBar({ progress }: { progress: MarathonProgress }) {
  const { done, total, complete, phase } = progress;
  const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-ink-soft">
          <span className="font-medium text-ink">{done}</span>
          {total != null ? ` de ${total}` : ""} {done === 1 && total == null ? "livro" : "livros"}
          {complete && " — maratona completa! 🎉"}
        </span>
        <span className="text-xs text-ink-soft">
          {complete ? "Concluída" : PHASE_LABEL[phase]}
        </span>
      </div>
      {total != null && (
        <div
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total}
          className="h-2.5 overflow-hidden rounded-full bg-paper"
        >
          <div
            className="h-full rounded-full bg-cover transition-[width]"
            style={{ width: `${done > 0 ? Math.max(4, pct) : 0}%` }}
          />
        </div>
      )}
    </div>
  );
}
