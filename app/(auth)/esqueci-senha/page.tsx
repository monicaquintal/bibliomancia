"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, type AuthActionState } from "@/actions/auth";

const initialState: AuthActionState = { error: null };

function SentBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("enviado") !== "1") return null;
  return (
    <p className="rounded-lg bg-cover/10 px-3 py-2 text-sm text-cover-dark">
      Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha.
    </p>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold text-ink">Esqueci a senha</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Informe seu e-mail e enviaremos um link para redefinir a senha.
        </p>
      </div>

      <Suspense fallback={null}>
        <SentBanner />
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

        {state.error && <p className="text-sm text-berry">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-cover px-3 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Enviar link"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        <Link href="/login" className="font-medium text-cover underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
