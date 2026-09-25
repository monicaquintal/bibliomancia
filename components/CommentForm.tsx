"use client";

import { useActionState, useRef } from "react";
import { addComment } from "@/actions/reading";

async function action(_prev: { error: string | null }, formData: FormData) {
  try {
    await addComment(formData);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao comentar" };
  }
}

export function CommentForm({ sessionId }: { sessionId: string }) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <textarea
        name="body"
        required
        rows={2}
        aria-label="Comentário sobre a leitura"
        placeholder="Escreva um comentário sobre a leitura até agora..."
        className="w-full rounded-lg border border-dust-line px-3 py-2 text-sm focus:border-cover focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="progressPage"
          type="number"
          min={1}
          aria-label="Página atual (opcional)"
          placeholder="Página (opcional)"
          className="w-36 rounded-lg border border-dust-line px-2 py-1 text-sm focus:border-cover focus:outline-none"
        />
        <input
          name="progressPercent"
          type="number"
          min={0}
          max={100}
          aria-label="Percentual concluído (opcional)"
          placeholder="% concluído (opcional)"
          className="w-40 rounded-lg border border-dust-line px-2 py-1 text-sm focus:border-cover focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-cover px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
        >
          Comentar
        </button>
      </div>
      {state.error && <p className="text-sm text-berry">{state.error}</p>}
    </form>
  );
}
