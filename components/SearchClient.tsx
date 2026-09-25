"use client";

import { useState } from "react";
import type { NormalizedVolume } from "@/lib/google-books";
import { BookResultCard } from "@/components/BookResultCard";

export function SearchClient({ existingVolumeIds }: { existingVolumeIds: string[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedVolume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const existingSet = new Set(existingVolumeIds);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(data.items ?? []);
    } catch {
      setError("Não foi possível buscar livros agora. Tente novamente.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar por título, autor ou ISBN"
          placeholder="Buscar por título, autor ou ISBN"
          className="flex-1 rounded-lg border border-dust-line px-3 py-2 text-sm focus:border-cover focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-cover px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark disabled:opacity-60"
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {error && <p className="text-sm text-berry">{error}</p>}

      {searched && !loading && results.length === 0 && !error && (
        <p className="text-sm text-ink-soft">Nenhum resultado encontrado.</p>
      )}

      <ul className="space-y-3">
        {results.map((volume) => (
          <BookResultCard
            key={volume.googleVolumeId}
            volume={volume}
            alreadyInLibrary={existingSet.has(volume.googleVolumeId)}
          />
        ))}
      </ul>
    </div>
  );
}
