"use client";

import { useMemo, useState } from "react";
import { importGoodreadsBatch, type ImportRowResult } from "@/actions/import";
import { parseGoodreadsCsv, shelfLabel, type GoodreadsRow } from "@/lib/goodreads";

const BATCH_SIZE = 5;

const OUTCOME_LABEL: Record<ImportRowResult["outcome"], string> = {
  importado: "importados",
  ja_existia: "já estavam na estante",
  nao_encontrado: "não encontrados no Google Books",
  erro: "com erro",
};

export function GoodreadsImport() {
  const [rows, setRows] = useState<GoodreadsRow[] | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [parseError, setParseError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [results, setResults] = useState<ImportRowResult[]>([]);
  const [done, setDone] = useState(false);

  const customShelves = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows ?? []) {
      for (const shelf of row.customShelves) counts.set(shelf, (counts.get(shelf) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const importing = progress !== null && !done;

  async function onFile(file: File | undefined) {
    setRows(null);
    setResults([]);
    setDone(false);
    setProgress(null);
    setParseError(null);
    if (!file) return;
    try {
      setRows(parseGoodreadsCsv(await file.text()));
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Não foi possível ler o arquivo");
    }
  }

  function toggleShelf(shelf: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (!next.delete(shelf)) next.add(shelf);
      return next;
    });
  }

  async function startImport() {
    if (!rows) return;
    const prepared = rows.map((row) => ({
      ...row,
      customShelves: row.customShelves.filter((s) => !excluded.has(s)),
    }));
    setResults([]);
    setDone(false);
    setProgress(0);

    for (let i = 0; i < prepared.length; i += BATCH_SIZE) {
      const batch = prepared.slice(i, i + BATCH_SIZE);
      try {
        const batchResults = await importGoodreadsBatch(batch);
        setResults((prev) => [...prev, ...batchResults]);
      } catch (err) {
        const detail = err instanceof Error ? err.message : "Falha na requisição";
        setResults((prev) => [
          ...prev,
          ...batch.map((r) => ({ title: r.title, outcome: "erro" as const, detail })),
        ]);
      }
      setProgress(Math.min(i + BATCH_SIZE, prepared.length));
    }
    setDone(true);
  }

  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.outcome] = (acc[r.outcome] ?? 0) + 1;
    return acc;
  }, {});
  const problems = results.filter((r) => r.outcome === "nao_encontrado" || r.outcome === "erro");

  return (
    <div className="space-y-6">
      <input
        type="file"
        accept=".csv,text/csv"
        disabled={importing}
        onChange={(e) => onFile(e.target.files?.[0])}
        className="block text-sm text-ink-soft file:mr-3 file:rounded-lg file:border file:border-dust-line file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink-soft"
      />
      {parseError && <p className="text-sm text-berry">{parseError}</p>}

      {rows && (
        <div className="space-y-4">
          <p className="text-sm text-ink">
            {rows.length} livros encontrados no arquivo.
          </p>

          {customShelves.length > 0 && (
            <fieldset disabled={importing} className="space-y-2">
              <legend className="text-sm font-medium text-ink">
                Prateleiras personalizadas viram estantes
              </legend>
              <p className="text-xs text-ink-soft">
                O livro entra em todas as estantes marcadas em que estava. Prateleiras como
                “dnf” ou “abandonados” viram o status Abandonado. Desmarque as que não quer trazer.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {customShelves.map(([shelf, count]) => (
                  <label key={shelf} className="flex items-center gap-1.5 text-sm text-ink-soft">
                    <input
                      type="checkbox"
                      checked={!excluded.has(shelf)}
                      onChange={() => toggleShelf(shelf)}
                    />
                    {shelfLabel(shelf)} ({count})
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <button
            type="button"
            onClick={startImport}
            disabled={importing}
            className="rounded-lg bg-cover px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
          >
            {importing ? "Importando…" : done ? "Importar de novo" : "Importar"}
          </button>
        </div>
      )}

      {progress !== null && rows && (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-dust-line">
            <div
              className="h-full rounded-full bg-cover transition-[width]"
              style={{ width: `${(progress / rows.length) * 100}%` }}
            />
          </div>
          <p className="text-sm text-ink-soft">
            {progress} de {rows.length}
          </p>
        </div>
      )}

      {done && (
        <div className="space-y-3">
          <ul className="text-sm text-ink">
            {(Object.keys(OUTCOME_LABEL) as ImportRowResult["outcome"][])
              .filter((key) => counts[key])
              .map((key) => (
                <li key={key}>
                  {counts[key]} {OUTCOME_LABEL[key]}
                </li>
              ))}
          </ul>
          {problems.length > 0 && (
            <details className="text-sm text-ink-soft">
              <summary className="cursor-pointer font-medium text-ink">
                Ver livros que não entraram
              </summary>
              <ul className="mt-2 space-y-1">
                {problems.map((r, i) => (
                  <li key={i}>
                    {r.title}
                    {r.detail ? ` — ${r.detail}` : ""}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
