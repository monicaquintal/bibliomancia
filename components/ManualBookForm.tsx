"use client";

import { useActionState } from "react";
import { addManualBook } from "@/actions/books";

const inputClass =
  "w-full rounded-lg border border-dust-line px-2.5 py-1.5 text-sm focus:border-cover focus:outline-none";

export function ManualBookForm() {
  const [state, formAction, pending] = useActionState(addManualBook, { error: null });

  return (
    <details className="rounded-lg border border-dust-line bg-paper-raised p-4">
      <summary className="cursor-pointer text-sm font-medium text-ink">
        Não achou o livro? Cadastre manualmente
      </summary>
      <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-medium text-ink-soft sm:col-span-2">
          Título *
          <input name="title" required maxLength={500} className={inputClass} />
        </label>
        <label className="space-y-1 text-xs font-medium text-ink-soft sm:col-span-2">
          Autor(es), separados por vírgula
          <input name="authors" maxLength={500} className={inputClass} />
        </label>
        <label className="space-y-1 text-xs font-medium text-ink-soft">
          Editora
          <input name="publisher" maxLength={300} className={inputClass} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-medium text-ink-soft">
            Páginas
            <input name="pageCount" type="number" min={1} className={inputClass} />
          </label>
          <label className="space-y-1 text-xs font-medium text-ink-soft">
            Ano
            <input name="year" type="number" min={0} max={3000} className={inputClass} />
          </label>
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-cover px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
          >
            Cadastrar e adicionar à estante
          </button>
          {state.error && <span className="text-sm text-berry">{state.error}</span>}
        </div>
      </form>
    </details>
  );
}
