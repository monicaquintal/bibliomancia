"use client";

import { useActionState, useState } from "react";
import { addManualBook } from "@/actions/books";

const inputClass =
  "w-full rounded-lg border border-dust-line bg-paper px-2.5 py-1.5 text-sm focus:border-cover focus:outline-none";
const labelClass = "space-y-1 text-xs font-medium text-ink-soft";

export function ManualBookForm({ collapsible = false }: { collapsible?: boolean }) {
  const [state, formAction, pending] = useActionState(addManualBook, { error: null });
  const [status, setStatus] = useState("quero");

  const form = (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <label className={`${labelClass} sm:col-span-2`}>
        Título *
        <input name="title" required maxLength={500} className={inputClass} />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        Subtítulo
        <input name="subtitle" maxLength={500} className={inputClass} />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        Autor(es), separados por vírgula
        <input name="authors" maxLength={500} className={inputClass} />
      </label>
      <label className={labelClass}>
        Editora
        <input name="publisher" maxLength={300} className={inputClass} />
      </label>
      <label className={labelClass}>
        ISBN
        <input name="isbn" inputMode="numeric" maxLength={17} className={inputClass} />
      </label>
      <label className={labelClass}>
        Páginas
        <input name="pageCount" type="number" min={1} className={inputClass} />
      </label>
      <label className={labelClass}>
        Ano de publicação
        <input name="year" type="number" min={0} max={3000} className={inputClass} />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        Capa (link de uma imagem)
        <input
          name="thumbnailUrl"
          type="url"
          placeholder="https://…"
          maxLength={2000}
          className={inputClass}
        />
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        Sinopse ou descrição
        <textarea name="description" rows={3} maxLength={5000} className={inputClass} />
      </label>

      <label className={labelClass}>
        Status inicial
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={inputClass}
        >
          <option value="quero">Quero ler</option>
          <option value="lendo">Lendo</option>
          <option value="lido">Lido</option>
        </select>
      </label>
      {status !== "quero" && (
        <>
          <label className={labelClass}>
            Formato
            <select name="format" defaultValue="livro" className={inputClass}>
              <option value="livro">Livro físico</option>
              <option value="ebook">Ebook</option>
              <option value="audiobook">Audiobook</option>
            </select>
          </label>
          <label className={labelClass}>
            {status === "lendo" ? "Início da leitura (opcional)" : "Término da leitura (opcional)"}
            <input name="date" type="date" className={inputClass} />
          </label>
        </>
      )}

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
  );

  if (!collapsible) {
    return <div className="rounded-lg border border-dust-line bg-paper-raised p-4">{form}</div>;
  }
  return (
    <details className="rounded-lg border border-dust-line bg-paper-raised p-4">
      <summary className="mb-4 cursor-pointer text-sm font-medium text-ink">
        Não achou o livro? Cadastre manualmente
      </summary>
      {form}
    </details>
  );
}
