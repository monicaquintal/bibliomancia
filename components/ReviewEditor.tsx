"use client";

import { useActionState, useState } from "react";
import { setReview } from "@/actions/reading";

async function action(_prev: { error: string | null; saved: boolean }, formData: FormData) {
  try {
    await setReview(formData);
    return { error: null, saved: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao salvar resenha", saved: false };
  }
}

export function ReviewEditor({
  sessionId,
  review,
}: {
  sessionId: string;
  review: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    saved: false,
  });
  const [isEditing, setIsEditing] = useState(!review);

  if (!isEditing) {
    return (
      <div className="space-y-2">
        <p className="whitespace-pre-wrap text-sm text-ink">{review}</p>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-sm font-medium text-cover underline"
        >
          Editar resenha
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="sessionId" value={sessionId} />
      <textarea
        name="review"
        rows={5}
        defaultValue={review ?? ""}
        aria-label="Resenha sobre o livro"
        placeholder="Escreva sua resenha sobre o livro..."
        className="w-full rounded-lg border border-dust-line px-3 py-2 text-sm focus:border-cover focus:outline-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-cover px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
        >
          Salvar resenha
        </button>
        {review && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-sm text-ink-soft hover:text-ink"
          >
            Cancelar
          </button>
        )}
        {state.error && <span className="text-sm text-berry">{state.error}</span>}
      </div>
    </form>
  );
}
