import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchVolumes, type NormalizedVolume } from "@/lib/google-books";
import {
  GENRES,
  SERIES_PREFERENCES,
  getSeriesVolumeNumber,
  isLikelySeriesEntry,
  isLowQualitySuggestion,
  type SeriesPreference,
} from "@/lib/discover";

// Ritmo assumido (páginas/dia) quando o usuário ainda não tem sessões de
// leitura concluídas com datas suficientes para calcular o próprio ritmo.
const DEFAULT_PACE = 20;
// A API devolve no máximo 20 itens por chamada nesta chave, mesmo pedindo mais.
const CANDIDATE_POOL_SIZE = 20;
const MAX_PAGES_TO_FETCH = 5;
// Páginas possíveis para sortear o ponto de partida da busca, para que um
// novo clique em "Sugerir livros" comece de um trecho diferente do catálogo.
// Mantido baixo de propósito: páginas mais profundas dos resultados do
// Google Books (>60) caem rapidamente em acervo antigo/obscuro e catálogos
// de biblioteca, bem menos relevantes que o topo do ranking de relevância.
const RANDOM_START_PAGES = 3;
const SUGGESTION_COUNT = 5;
const POOL_TARGET = 15; // reúne mais candidatos que o necessário antes de sortear
const LANGUAGE = "pt";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function daysBetween(startIso: string, endIso: string) {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

async function getReadingPace(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<number> {
  const { data } = await supabase
    .from("reading_sessions")
    .select("started_at, finished_at, library_entries(books(page_count))")
    .eq("user_id", userId)
    .eq("status", "concluida")
    .not("started_at", "is", null)
    .not("finished_at", "is", null);

  let totalPages = 0;
  let totalDays = 0;
  for (const session of data ?? []) {
    const pageCount = session.library_entries?.books?.page_count;
    if (!pageCount || !session.started_at || !session.finished_at) continue;
    totalPages += pageCount;
    totalDays += daysBetween(session.started_at, session.finished_at);
  }

  return totalDays > 0 ? totalPages / totalDays : DEFAULT_PACE;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const genre = GENRES.find((g) => g.value === searchParams.get("genre"));
  if (!genre) {
    return NextResponse.json({ error: "Gênero inválido" }, { status: 400 });
  }

  const seriesParam = searchParams.get("series") ?? "any";
  if (!SERIES_PREFERENCES.includes(seriesParam as SeriesPreference)) {
    return NextResponse.json({ error: "Preferência de série inválida" }, { status: 400 });
  }
  const seriesPreference = seriesParam as SeriesPreference;

  const maxDaysParam = searchParams.get("maxDays");
  const maxDays =
    maxDaysParam && /^\d+$/.test(maxDaysParam) ? Number.parseInt(maxDaysParam, 10) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const [{ data: entries }, pace] = await Promise.all([
      supabase.from("library_entries").select("books(google_volume_id)").eq("user_id", user.id),
      getReadingPace(supabase, user.id),
    ]);

    const ownedIds = new Set(
      (entries ?? [])
        .map((entry) => entry.books?.google_volume_id)
        .filter((id): id is string => Boolean(id)),
    );

    const maxPages = maxDays && maxDays > 0 ? Math.round(maxDays * pace * 1.25) : null;

    const seenBooks = new Set<string>();
    const candidates: NormalizedVolume[] = [];
    const startPage = Math.floor(Math.random() * RANDOM_START_PAGES);

    for (let i = 0; i < MAX_PAGES_TO_FETCH && candidates.length < POOL_TARGET; i++) {
      const { items } = await searchVolumes(
        genre.query,
        (startPage + i) * CANDIDATE_POOL_SIZE,
        CANDIDATE_POOL_SIZE,
        LANGUAGE,
      );
      if (items.length === 0) break;

      for (const volume of items) {
        // O Google Books relata variantes regionais ("pt-BR", "pt-PT"), não
        // apenas "pt" — e `langRestrict` não filtra de forma confiável, daí o
        // filtro aqui ser a garantia real de que o livro está em português.
        if (!volume.language?.startsWith(LANGUAGE)) continue;
        if (ownedIds.has(volume.googleVolumeId)) continue;
        if (!volume.thumbnailUrl || volume.authors.length === 0) continue;
        if (isLowQualitySuggestion(volume)) continue;
        // Buscas em texto livre trazem junto acervo antigo (bibliografias,
        // catálogos de biblioteca do século XIX/XX); exceto para "Clássicos",
        // isso quase nunca é o que a pessoa quer ao pedir uma sugestão.
        if (
          genre.value !== "classicos" &&
          volume.publishedYear != null &&
          volume.publishedYear < 1980
        ) {
          continue;
        }

        const dedupeKey = `${volume.title.toLowerCase()}|${volume.authors[0].toLowerCase()}`;
        if (seenBooks.has(dedupeKey)) continue;
        seenBooks.add(dedupeKey);

        const isSeries = isLikelySeriesEntry(volume);
        if (seriesPreference === "standalone" && isSeries) continue;
        if (seriesPreference === "series" && !isSeries) continue;

        // Nunca sugerir volumes avulsos de uma série que não sejam o
        // primeiro — quem está descobrindo o livro precisa começar do início.
        const seriesVolume = getSeriesVolumeNumber(volume);
        if (isSeries && seriesVolume != null && seriesVolume !== 1) continue;

        if (maxPages && volume.pageCount && volume.pageCount > maxPages) continue;

        candidates.push(volume);
      }
    }

    // Sorteia quais livros entram (para variar a cada clique), mas dentro da
    // seleção final mostra os mais recentes primeiro.
    const selected = shuffle(candidates)
      .slice(0, SUGGESTION_COUNT)
      .sort((a, b) => (b.publishedYear ?? 0) - (a.publishedYear ?? 0));

    return NextResponse.json({
      items: selected,
      pace: Math.round(pace),
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível buscar sugestões agora. Tente novamente." },
      { status: 502 },
    );
  }
}
