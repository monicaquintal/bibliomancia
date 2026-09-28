"use client";

import { useState, useTransition } from "react";
import { addBookToLibrary } from "@/actions/books";
import type { NormalizedVolume } from "@/lib/google-books";

export function BookResultCard({
  volume,
  alreadyInLibrary,
}: {
  volume: NormalizedVolume;
  alreadyInLibrary: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="flex gap-4 rounded-lg border border-dust-line bg-paper-raised p-4">
      <div className="h-24 w-16 shrink-0 overflow-hidden rounded-sm bg-dust-line">
        {volume.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={volume.thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="text-left"
        >
          <p
            className={`font-serif font-medium leading-snug text-ink underline decoration-dust-line decoration-1 underline-offset-2 transition-colors hover:text-cover hover:decoration-cover ${expanded ? "" : "line-clamp-2"}`}
          >
            {volume.title}
          </p>
        </button>
        {volume.subtitle && (
          <p className="truncate text-sm text-ink-soft">{volume.subtitle}</p>
        )}
        <p className="truncate text-sm text-ink-soft">
          {volume.authors.length > 0 ? volume.authors.join(", ") : "Autor desconhecido"}
        </p>
        <p className="text-xs text-ink-soft/80">
          {[volume.publisher, volume.publishedYear, volume.isbn13 ?? volume.isbn10]
            .filter(Boolean)
            .join(" · ") || "Sem edição informada"}
        </p>

        {expanded && (
          <div className="mt-1 space-y-2 border-t border-dust-line pt-2 text-sm text-ink-soft">
            {volume.averageRating != null && (
              <p>
                ★ {volume.averageRating.toFixed(1)}
                {volume.ratingsCount ? ` · ${volume.ratingsCount} avaliações` : ""}
              </p>
            )}
            {volume.pageCount != null && <p>{volume.pageCount} páginas</p>}
            {volume.description ? (
              <p>{volume.description}</p>
            ) : (
              <p className="italic">Sem descrição disponível.</p>
            )}
          </div>
        )}

        <div className="mt-2">
          {alreadyInLibrary ? (
            <span className="text-sm text-ink-soft">Já está na sua biblioteca</span>
          ) : (
            <form
              action={(formData) => startTransition(() => addBookToLibrary(formData))}
            >
              <input type="hidden" name="googleVolumeId" value={volume.googleVolumeId} />
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-cover px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
              >
                {pending ? "Adicionando…" : "Adicionar à minha biblioteca"}
              </button>
            </form>
          )}
        </div>
      </div>
    </li>
  );
}
