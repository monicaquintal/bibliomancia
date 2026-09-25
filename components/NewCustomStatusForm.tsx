"use client";

import { useActionState } from "react";
import { createCustomStatus } from "@/actions/reading";

async function action(_prev: { error: string | null }, formData: FormData) {
  try {
    await createCustomStatus(formData);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao criar status" };
  }
}

export function NewCustomStatusForm() {
  const [state, formAction, pending] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        name="label"
        aria-label="Nome do novo status"
        placeholder="Criar status personalizado (ex: Pausado)"
        required
        maxLength={40}
        className="rounded-lg border border-dust-line px-2.5 py-1.5 text-sm focus:border-cover focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-dust-line px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft hover:text-ink disabled:opacity-60"
      >
        Adicionar
      </button>
      {state.error && <span className="text-sm text-berry">{state.error}</span>}
    </form>
  );
}
