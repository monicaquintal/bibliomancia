"use client";

import { useActionState } from "react";
import { createMarathon, updateMarathon } from "@/actions/marathons";

const inputClass =
  "w-full rounded-lg border border-dust-line bg-paper px-2.5 py-1.5 text-sm focus:border-cover focus:outline-none";
const labelClass = "space-y-1 text-xs font-medium text-ink-soft";

type State = { error: string | null; saved?: boolean };

export type MarathonFormValues = {
  id: string;
  name: string;
  description: string | null;
  starts_on: string | null;
  ends_on: string | null;
  target_books: number | null;
  cover_url: string | null;
};

// Sem `marathon`: cria uma nova. Com `marathon`: edita a existente.
export function MarathonForm({ marathon }: { marathon?: MarathonFormValues }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    marathon ? updateMarathon : createMarathon,
    { error: null },
  );

  return (
    <details className="rounded-lg border border-dust-line bg-paper-raised p-4">
      <summary className="mb-4 cursor-pointer text-sm font-medium text-ink">
        {marathon ? "Editar maratona" : "Nova maratona"}
      </summary>
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        {marathon && <input type="hidden" name="marathonId" value={marathon.id} />}
        <label className={`${labelClass} sm:col-span-2`}>
          Nome *
          <input
            name="name"
            required
            maxLength={80}
            defaultValue={marathon?.name}
            placeholder="Ex: Trono de Vidro completo, 3 livros em maio"
            className={inputClass}
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Descrição
          <textarea
            name="description"
            rows={2}
            maxLength={1000}
            defaultValue={marathon?.description ?? ""}
            className={inputClass}
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Capa (link de uma imagem, opcional)
          <input
            name="coverUrl"
            type="url"
            placeholder="https://…"
            maxLength={2000}
            defaultValue={marathon?.cover_url ?? ""}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Início (opcional)
          <input name="startsOn" type="date" defaultValue={marathon?.starts_on ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          Fim (opcional)
          <input name="endsOn" type="date" defaultValue={marathon?.ends_on ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          Meta de livros (opcional)
          <input
            name="targetBooks"
            type="number"
            min={1}
            max={1000}
            defaultValue={marathon?.target_books ?? ""}
            className={inputClass}
          />
        </label>
        {!marathon && (
          <p className="text-xs text-ink-soft sm:col-span-2">
            Escolha os livros depois de criar: o progresso é quantos deles você leu. Se preferir
            não montar uma lista, defina período e meta, e contamos os livros que você terminar
            nesse intervalo.
          </p>
        )}
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-cover px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
          >
            {marathon ? "Salvar alterações" : "Criar maratona"}
          </button>
          {state.error && <span className="text-sm text-berry">{state.error}</span>}
          {state.saved && !state.error && <span className="text-sm text-cover">Salvo!</span>}
        </div>
      </form>
    </details>
  );
}
