"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusGlyph } from "@/components/StatusGlyph";
import { statusTone } from "@/lib/status-colors";

const FORMAT_LABEL: Record<string, string> = {
  livro: "Livro físico",
  ebook: "Ebook",
  audiobook: "Audiobook",
};

export type LibraryEntryView = {
  id: string;
  title: string;
  authors: string[];
  thumbnailUrl: string | null;
  statusKey: string;
  statusLabel: string;
  lastFormat: string | null;
  sessionCount: number;
};

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function LibrarySearch({ entries }: { entries: LibraryEntryView[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return entries;
    return entries.filter(
      (e) => normalize(e.title).includes(q) || e.authors.some((a) => normalize(a).includes(q)),
    );
  }, [entries, query]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por título ou autor..."
        aria-label="Buscar na estante por título ou autor"
        className="w-full max-w-sm rounded-lg border border-dust-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-cover"
      />

      {entries.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-ink-soft">
          Nenhum livro encontrado para &ldquo;{query}&rdquo;.
        </p>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((entry) => {
          const tone = statusTone(entry.statusKey);
          return (
            <li key={entry.id}>
              <Link
                href={`/library/${entry.id}`}
                className="flex overflow-hidden rounded-lg border border-dust-line bg-paper-raised transition-colors hover:border-ink-soft"
              >
                <span className="w-1.5 shrink-0" style={{ background: tone.dot }} />
                <div className="flex flex-1 gap-3 p-3">
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded-sm bg-dust-line">
                    {entry.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="line-clamp-2 font-serif font-medium leading-snug text-ink">
                      {entry.title}
                    </p>
                    <p className="truncate text-sm text-ink-soft">{entry.authors.join(", ")}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs">
                      <span
                        className="flex items-center gap-1 font-medium"
                        style={{ color: tone.fg }}
                      >
                        <StatusGlyph statusKey={entry.statusKey} maskColor="var(--paper-raised)" />
                        {entry.statusLabel}
                      </span>
                      {entry.lastFormat && (
                        <span className="text-ink-soft">{FORMAT_LABEL[entry.lastFormat]}</span>
                      )}
                      {entry.sessionCount > 1 && (
                        <span className="text-ink-soft">{entry.sessionCount} leituras</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
