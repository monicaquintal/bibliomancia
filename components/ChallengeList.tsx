"use client";

import Link from "next/link";
import { useState } from "react";
import { assignChallengeBook, removeChallenge } from "@/actions/marathons";

export type ChallengeView = {
  id: string;
  title: string;
  book: {
    entryId: string;
    title: string;
    authors: string[];
    thumbnailUrl: string | null;
    done: boolean;
    note: string;
  } | null;
};

export type BookOption = { id: string; label: string };

function Picker({
  marathonId,
  challengeId,
  options,
  current,
}: {
  marathonId: string;
  challengeId: string;
  options: BookOption[];
  current: string | null;
}) {
  return (
    <form action={assignChallengeBook} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="marathonId" value={marathonId} />
      <input type="hidden" name="challengeId" value={challengeId} />
      <select
        name="entryId"
        required
        defaultValue={current ?? ""}
        aria-label="Livro para este desafio"
        className="max-w-full rounded-lg border border-dust-line bg-paper px-2 py-1 text-sm focus:border-cover focus:outline-none"
      >
        <option value="" disabled>
          Escolher livro…
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg border border-dust-line px-2.5 py-1 text-sm font-medium text-ink-soft hover:border-ink-soft hover:text-ink"
      >
        Usar
      </button>
    </form>
  );
}

export function ChallengeList({
  marathonId,
  challenges,
  options,
}: {
  marathonId: string;
  challenges: ChallengeView[];
  options: BookOption[];
}) {
  // o seletor (com todas as opções) só é montado para o desafio que está sendo editado
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {challenges.map((c) => {
        const own = c.book ? [{ id: c.book.entryId, label: c.book.title }] : [];
        return (
          <li
            key={c.id}
            className="flex flex-col gap-2 rounded-lg border border-dust-line bg-paper-raised p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                    c.book?.done
                      ? "border-cover bg-cover text-paper"
                      : "border-dust-line text-transparent"
                  }`}
                >
                  ✓
                </span>
                <p className="font-serif text-sm font-medium text-ink">{c.title}</p>
              </div>
              <form action={removeChallenge}>
                <input type="hidden" name="marathonId" value={marathonId} />
                <input type="hidden" name="challengeId" value={c.id} />
                <button
                  type="submit"
                  aria-label={`Remover o desafio ${c.title}`}
                  className="px-1 text-lg leading-none text-ink-soft hover:text-berry"
                >
                  ×
                </button>
              </form>
            </div>

            {c.book && editing !== c.id && (
              <div className="flex items-center gap-3">
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-sm bg-dust-line">
                  {c.book.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.book.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/library/${c.book.entryId}`}
                    className="line-clamp-2 text-sm font-medium text-ink hover:underline"
                  >
                    {c.book.title}
                  </Link>
                  <p className={`text-xs ${c.book.done ? "font-medium text-cover" : "text-ink-soft"}`}>
                    {c.book.note}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(c.id)}
                  className="text-xs text-ink-soft underline hover:text-ink"
                >
                  trocar
                </button>
              </div>
            )}

            {(!c.book || editing === c.id) &&
              (editing === c.id ? (
                <Picker
                  marathonId={marathonId}
                  challengeId={c.id}
                  options={[...own, ...options]}
                  current={c.book?.entryId ?? null}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(c.id)}
                  className="self-start text-sm text-ink-soft underline hover:text-ink"
                >
                  Escolher livro
                </button>
              ))}
          </li>
        );
      })}
    </ul>
  );
}
