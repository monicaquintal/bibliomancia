const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";

export interface NormalizedVolume {
  googleVolumeId: string;
  isbn10: string | null;
  isbn13: string | null;
  title: string;
  subtitle: string | null;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null;
  publishedYear: number | null;
  description: string | null;
  pageCount: number | null;
  language: string | null;
  thumbnailUrl: string | null;
  categories: string[];
  averageRating: number | null;
  ratingsCount: number | null;
}

interface GoogleVolumeItem {
  id: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    language?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
  };
}

interface GoogleVolumesResponse {
  items?: GoogleVolumeItem[];
  totalItems?: number;
}

const ISBN_RE = /^(?:\d{9}[\dXx]|\d{13})$/;

function isIsbn(query: string): boolean {
  return ISBN_RE.test(query.replace(/[-\s]/g, ""));
}

function toHttps(url: string | undefined | null): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//, "https://");
}

function stripHtml(text: string | undefined | null): string | null {
  if (!text) return null;
  return text.replace(/<[^>]+>/g, "").trim() || null;
}

function normalizeVolume(item: GoogleVolumeItem): NormalizedVolume {
  const info = item.volumeInfo ?? {};
  const identifiers = info.industryIdentifiers ?? [];
  const isbn13 = identifiers.find((i) => i.type === "ISBN_13")?.identifier ?? null;
  const isbn10 = identifiers.find((i) => i.type === "ISBN_10")?.identifier ?? null;
  const publishedYear = info.publishedDate
    ? Number.parseInt(info.publishedDate.slice(0, 4), 10) || null
    : null;

  return {
    googleVolumeId: item.id,
    isbn10,
    isbn13,
    title: info.title ?? "Título desconhecido",
    subtitle: info.subtitle ?? null,
    authors: info.authors ?? [],
    publisher: info.publisher ?? null,
    publishedDate: info.publishedDate ?? null,
    publishedYear,
    description: stripHtml(info.description),
    pageCount: info.pageCount ?? null,
    language: info.language ?? null,
    thumbnailUrl: toHttps(info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail),
    categories: info.categories ?? [],
    averageRating: info.averageRating ?? null,
    ratingsCount: info.ratingsCount ?? null,
  };
}

function buildQuery(rawQuery: string): string {
  const trimmed = rawQuery.trim();
  return isIsbn(trimmed) ? `isbn:${trimmed.replace(/[-\s]/g, "")}` : trimmed;
}

export async function searchVolumes(
  rawQuery: string,
  startIndex = 0,
  maxResults = 20,
  langRestrict?: string,
): Promise<{ items: NormalizedVolume[]; totalItems: number }> {
  const params = new URLSearchParams({
    q: buildQuery(rawQuery),
    startIndex: String(startIndex),
    maxResults: String(maxResults),
  });
  if (langRestrict) {
    params.set("langRestrict", langRestrict);
  }
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }

  const res = await fetch(`${GOOGLE_BOOKS_API}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Google Books API respondeu ${res.status}`);
  }
  const data: GoogleVolumesResponse = await res.json();
  return {
    items: (data.items ?? []).map(normalizeVolume),
    totalItems: data.totalItems ?? 0,
  };
}

export async function getVolumeById(googleVolumeId: string): Promise<NormalizedVolume> {
  const params = new URLSearchParams();
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }
  const qs = params.toString();
  const res = await fetch(
    `${GOOGLE_BOOKS_API}/${encodeURIComponent(googleVolumeId)}${qs ? `?${qs}` : ""}`,
  );
  if (!res.ok) {
    throw new Error(`Google Books API respondeu ${res.status}`);
  }
  const item: GoogleVolumeItem = await res.json();
  return normalizeVolume(item);
}
