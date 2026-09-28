"use client";

import { useActionState } from "react";
import { updatePassword, type AuthActionState } from "@/actions/auth";

const initialState: AuthActionState = { error: null };

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold text-ink">Nova senha</h1>
        <p className="mt-1 text-sm text-ink-soft">Escolha uma nova senha para sua conta.</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Nova senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            className="mt-1 w-full rounded-lg border border-dust-line px-3 py-2 text-sm focus:border-cover focus:outline-none"
          />
        </div>

        {state.error && <p className="text-sm text-berry">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-cover px-3 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
