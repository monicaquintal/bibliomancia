"use client";

import { useActionState } from "react";
import { setReadingGoal } from "@/actions/goals";

async function action(_prev: { error: string | null }, formData: FormData) {
  try {
    await setReadingGoal(formData);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar meta" };
  }
}

export function ReadingGoalCard({
  year,
  target,
  progress,
}: {
  year: number;
  target: number | null;
  progress: number;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  const pct = target ? Math.min(100, Math.round((progress / target) * 100)) : 0;
  const done = target != null && progress >= target;

  return (
    <div className="space-y-3 rounded-lg border border-dust-line bg-paper-raised p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold text-ink">Meta de {year}</h2>
        {target != null && (
          <p className="text-sm text-ink-soft">
            <span className="font-medium text-ink">{progress}</span> de {target} livros
            {done && " — meta batida! 🎉"}
          </p>
        )}
      </div>

      {target != null && (
        <div className="h-2.5 overflow-hidden rounded-full bg-paper">
          <div
            className="h-full rounded-full bg-cover transition-[width]"
            style={{ width: `${Math.max(4, pct)}%` }}
          />
        </div>
      )}

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="year" value={year} />
        <label htmlFor="targetBooks" className="text-sm text-ink-soft">
          {target == null ? "Quantos livros você quer ler este ano?" : "Ajustar meta:"}
        </label>
        <input
          id="targetBooks"
          name="targetBooks"
          type="number"
          min={1}
          max={1000}
          required
          defaultValue={target ?? undefined}
          className="w-20 rounded-lg border border-dust-line bg-paper px-2.5 py-1.5 text-sm focus:border-cover focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-dust-line px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft hover:text-ink disabled:opacity-60"
        >
          {target == null ? "Definir meta" : "Salvar"}
        </button>
        {state.error && <span className="text-sm text-berry">{state.error}</span>}
      </form>
    </div>
  );
}
