import type { NormalizedVolume } from "@/lib/google-books";

// Segunda fonte de catálogo, usada só quando o Google Books não acha o livro.
// O id vai para books.google_volume_id com prefixo "ol:" (a coluna é um texto único genérico).
const OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json";
const FIELDS =
  "key,title,subtitle,author_name,first_publish_year,number_of_pages_median,publisher,isbn,cover_i,language";

interface OpenLibraryDoc {
  key: string;
  title?: string;
  subtitle?: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  publisher?: string[];
  isbn?: string[];
  cover_i?: number;
  language?: string[];
}

const LANGUAGES: Record<string, string> = {
  por: "pt",
  eng: "en",
  spa: "es",
  fre: "fr",
  ger: "de",
  ita: "it",
};

function norm(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titlesMatch(a: string, b: string): boolean {
  const x = norm(a);
  const y = norm(b);
  return x === y || x.startsWith(`${y} `) || y.startsWith(`${x} `);
}

function authorMatches(wanted: string, found: string[] | undefined): boolean {
  const last = norm(wanted.split(",")[0] ?? "").split(" ").pop();
  if (!last) return true;
  return norm((found ?? []).join(" ")).split(" ").includes(last);
}

function toVolume(doc: OpenLibraryDoc): NormalizedVolume {
  const isbns = doc.isbn ?? [];
  return {
    googleVolumeId: `ol:${doc.key.replace(/^\/works\//, "")}`,
    isbn10: isbns.find((i) => i.length === 10) ?? null,
    isbn13: isbns.find((i) => i.length === 13) ?? null,
    title: doc.title ?? "Título desconhecido",
    subtitle: doc.subtitle ?? null,
    authors: doc.author_name ?? [],
    publisher: doc.publisher?.[0] ?? null,
    publishedDate: doc.first_publish_year ? String(doc.first_publish_year) : null,
    publishedYear: doc.first_publish_year ?? null,
    description: null,
    pageCount: doc.number_of_pages_median ?? null,
    language: LANGUAGES[doc.language?.[0] ?? ""] ?? null,
    thumbnailUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    categories: [],
    averageRating: null,
    ratingsCount: null,
  };
}

async function search(params: Record<string, string>): Promise<OpenLibraryDoc[]> {
  const qs = new URLSearchParams({ ...params, fields: FIELDS, limit: "5" });
  try {
    const res = await fetch(`${OPEN_LIBRARY_SEARCH}?${qs}`, {
      headers: { "User-Agent": "Bibliomancia (personal reading tracker)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data: { docs?: OpenLibraryDoc[] } = await res.json();
    return data.docs ?? [];
  } catch {
    // fallback nunca deve derrubar a importação
    return [];
  }
}

export async function findOpenLibraryVolume(query: {
  title: string;
  author: string;
  isbn10: string | null;
  isbn13: string | null;
}): Promise<NormalizedVolume | null> {
  for (const isbn of [query.isbn13, query.isbn10]) {
    if (!isbn) continue;
    const [doc] = await search({ q: `isbn:${isbn}` });
    if (doc) return toVolume(doc);
  }

  // Só aceita se título e autor batem: um resultado errado é pior que nenhum.
  const docs = await search({
    title: query.title,
    ...(query.author ? { author: query.author.split(",")[0].trim() } : {}),
  });
  const match = docs.find(
    (doc) =>
      doc.title &&
      titlesMatch(doc.title, query.title) &&
      authorMatches(query.author, doc.author_name),
  );
  return match ? toVolume(match) : null;
}
