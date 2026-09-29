"use client";

import { useActionState, useRef } from "react";
import { createShelf } from "@/actions/shelves";

async function action(_prev: { error: string | null }, formData: FormData) {
  try {
    await createShelf(formData);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao criar estante" };
  }
}

export function NewShelfForm({ entryId }: { entryId?: string }) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      {entryId && <input type="hidden" name="entryId" value={entryId} />}
      <input
        name="name"
        aria-label="Nome da nova estante"
        placeholder={entryId ? "Nova estante" : "Criar estante (ex: Favoritos)"}
        required
        maxLength={40}
        className="rounded-lg border border-dust-line px-2.5 py-1.5 text-sm focus:border-cover focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-dust-line px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft hover:text-ink disabled:opacity-60"
      >
        {entryId ? "Criar e adicionar" : "Adicionar"}
      </button>
      {state.error && <span className="text-sm text-berry">{state.error}</span>}
    </form>
  );
}
