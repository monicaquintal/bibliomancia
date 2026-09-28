"use client";

import { useState } from "react";
import type { NormalizedVolume } from "@/lib/google-books";
import { GENRES } from "@/lib/discover";
import { BookResultCard } from "@/components/BookResultCard";

const SERIES_OPTIONS = [
  { value: "any", label: "Não importa" },
  { value: "standalone", label: "Livro único" },
  { value: "series", label: "Parte de uma série" },
];

export function DiscoverForm() {
  const [genre, setGenre] = useState(GENRES[0].value);
  const [series, setSeries] = useState("any");
  const [maxDays, setMaxDays] = useState("");
  const [results, setResults] = useState<NormalizedVolume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({ genre, series });
      if (maxDays.trim()) params.set("maxDays", maxDays.trim());
      const res = await fetch(`/api/books/discover?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");
      setResults(data.items ?? []);
    } catch {
      setError("Não foi possível buscar sugestões agora. Tente novamente.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-lg border border-dust-line bg-paper-raised p-4 sm:grid-cols-3"
      >
        <label className="flex flex-col gap-1 text-sm text-ink-soft">
          Gênero
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="rounded-lg border border-dust-line bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-cover focus:outline-none"
          >
            {GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-soft">
          É série?
          <select
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            className="rounded-lg border border-dust-line bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-cover focus:outline-none"
          >
            {SERIES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-soft">
          Terminar em quantos dias?
          <input
            type="number"
            min={1}
            max={365}
            value={maxDays}
            onChange={(e) => setMaxDays(e.target.value)}
            placeholder="Sem limite"
            className="rounded-lg border border-dust-line bg-paper px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-soft/70 focus:border-cover focus:outline-none"
          />
        </label>

        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-cover px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
          >
            {loading ? "Buscando…" : "Sugerir livros"}
          </button>
          <p className="mt-2 text-xs text-ink-soft">
            Se você informar um prazo, usamos o seu ritmo médio de leitura (ou uma estimativa,
            caso ainda não tenha histórico) para calcular até quantas páginas o livro pode ter.
          </p>
        </div>
      </form>

      {error && <p className="text-sm text-berry">{error}</p>}

      {searched && !loading && !error && results.length === 0 && (
        <p className="text-sm text-ink-soft">
          Nenhuma sugestão encontrada com esses filtros. Tente outro gênero, outra preferência de
          série ou um prazo maior.
        </p>
      )}

      {results.length > 0 && (
        <ul className="space-y-3">
          {results.map((volume) => (
            <BookResultCard key={volume.googleVolumeId} volume={volume} alreadyInLibrary={false} />
          ))}
        </ul>
      )}
    </div>
  );
}
