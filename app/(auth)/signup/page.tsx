"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/actions/auth";

const initialState: AuthActionState = { error: null };

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold text-ink">Criar conta</h1>
        <p className="mt-1 text-sm text-ink-soft">Crie sua biblioteca pessoal de leitura.</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            spellCheck={false}
            className="mt-1 w-full rounded-lg border border-dust-line px-3 py-2 text-sm focus:border-cover focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-dust-line px-3 py-2 text-sm focus:border-cover focus:outline-none"
          />
        </div>

        {state.error && <p className="text-sm text-berry">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-cover px-3 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
        >
          {pending ? "Criando…" : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-cover underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
