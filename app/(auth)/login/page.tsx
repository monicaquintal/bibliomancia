"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthActionState } from "@/actions/auth";

const initialState: AuthActionState = { error: null };

function SignupSuccessBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("signup") !== "success") return null;
  return (
    <p className="rounded-lg bg-cover/10 px-3 py-2 text-sm text-cover-dark">
      Conta criada! Verifique seu e-mail para confirmar o cadastro e depois entre.
    </p>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold text-ink">Entrar</h1>
        <p className="mt-1 text-sm text-ink-soft">Acesse sua biblioteca pessoal.</p>
      </div>

      <Suspense fallback={null}>
        <SignupSuccessBanner />
      </Suspense>

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
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-dust-line px-3 py-2 text-sm focus:border-cover focus:outline-none"
          />
        </div>

        {state.error && <p className="text-sm text-berry">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-cover px-3 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="font-medium text-cover underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
