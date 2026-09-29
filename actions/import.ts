"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { searchVolumes, type NormalizedVolume } from "@/lib/google-books";
import { findOpenLibraryVolume } from "@/lib/open-library";
import { upsertBook } from "@/lib/books-cache";
import { slugify } from "@/lib/slug";
import { formatFromBinding, isAbandonedShelf, shelfLabel } from "@/lib/goodreads";
import { importBatchSchema } from "@/lib/validation";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ImportOutcome = "importado" | "ja_existia" | "erro";

export type ImportSource = "google" | "openlibrary" | "manual";

export interface ImportRowResult {
  title: string;
  outcome: ImportOutcome;
  source?: ImportSource;
  detail?: string;
}

type ImportRow = ReturnType<typeof importBatchSchema.parse>["rows"][number];

async function findInGoogle(row: ImportRow): Promise<NormalizedVolume | null> {
  for (const isbn of [row.isbn13, row.isbn10]) {
    if (!isbn) continue;
    const { items } = await searchVolumes(isbn, 0, 1);
    if (items[0]) return items[0];
  }
  // Goodreads acrescenta série/edição ao título: "Dom Casmurro (Col, #1)", "X (Portuguese Edition)"
  const title = row.title.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const author = row.author.split(",")[0]?.trim();
  const queries = [
    author ? `intitle:${JSON.stringify(title)} inauthor:${JSON.stringify(author)}` : null,
    author ? `${title} ${author}` : null,
    `intitle:${JSON.stringify(title)}`,
  ];
  for (const query of queries) {
    if (!query) continue;
    const { items } = await searchVolumes(query, 0, 1);
    if (items[0]) return items[0];
  }
  return null;
}

// Sem catálogo que reconheça o livro, cria a partir dos dados do próprio CSV.
// O id vem do Book Id do Goodreads, então importar de novo não duplica.
function volumeFromRow(row: ImportRow): NormalizedVolume {
  const id = row.goodreadsId || slugify(`${row.title} ${row.author}`);
  return {
    googleVolumeId: `manual:gr:${id}`,
    isbn10: row.isbn10,
    isbn13: row.isbn13,
    title: row.title,
    subtitle: null,
    authors: row.author ? [row.author] : [],
    publisher: row.publisher,
    publishedDate: row.year ? String(row.year) : null,
    publishedYear: row.year,
    description: null,
    pageCount: row.pageCount,
    language: null,
    thumbnailUrl: null,
    categories: [],
    averageRating: null,
    ratingsCount: null,
  };
}

async function resolveVolume(
  row: ImportRow,
): Promise<{ volume: NormalizedVolume; source: ImportSource }> {
  const google = await findInGoogle(row);
  if (google) return { volume: google, source: "google" };

  const cleanTitle = row.title.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const openLibrary = await findOpenLibraryVolume({
    title: cleanTitle,
    author: row.author,
    isbn10: row.isbn10,
    isbn13: row.isbn13,
  });
  if (openLibrary) return { volume: openLibrary, source: "openlibrary" };

  return { volume: volumeFromRow(row), source: "manual" };
}

async function ensureShelf(
  supabase: Supabase,
  userId: string,
  shelf: string,
  cache: Map<string, string>,
): Promise<string | null> {
  const name = shelfLabel(shelf);
  const cacheKey = name.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { data: existing } = await supabase
    .from("shelves")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", name.replace(/[\\%_]/g, "\\$&"))
    .maybeSingle();
  let id = existing?.id ?? null;

  if (!id) {
    const { data: created } = await supabase
      .from("shelves")
      .insert({ user_id: userId, name })
      .select("id")
      .single();
    id = created?.id ?? null;
  }
  if (id) cache.set(cacheKey, id);
  return id;
}

export async function importGoodreadsBatch(rows: unknown): Promise<ImportRowResult[]> {
  const parsed = importBatchSchema.safeParse({ rows });
  if (!parsed.success) throw new Error("Dados inválidos");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: systemStatuses } = await supabase
    .from("reading_statuses")
    .select("id, key")
    .is("user_id", null);
  const systemId = (key: string) => systemStatuses?.find((s) => s.key === key)?.id ?? null;

  const shelfCache = new Map<string, string>();
  const results: ImportRowResult[] = [];

  for (const row of parsed.data.rows) {
    // respiro entre livros para não estourar o limite do Google Books
    if (results.length > 0) await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      const { volume, source } = await resolveVolume(row);
      const { id: bookId, error: bookError } = await upsertBook(supabase, volume);
      if (bookError || !bookId) throw new Error(bookError ?? "Falha ao salvar o livro");

      const abandoned = row.customShelves.some(isAbandonedShelf);
      const shelfNames = row.customShelves.filter((s) => !isAbandonedShelf(s));

      const sessionStatus = abandoned
        ? "abandonada"
        : row.exclusiveShelf === "read"
          ? "concluida"
          : row.exclusiveShelf === "currently-reading"
            ? "em_andamento"
            : null;

      const statusId = systemId(
        abandoned
          ? "abandonado"
          : row.exclusiveShelf === "read"
            ? "lido"
            : row.exclusiveShelf === "currently-reading"
              ? "lendo"
              : "quero",
      );
      if (!statusId) throw new Error("Status não configurado");

      const { data: entry, error: entryError } = await supabase
        .from("library_entries")
        .upsert(
          { user_id: user.id, book_id: bookId, status_id: statusId },
          { onConflict: "user_id,book_id", ignoreDuplicates: true },
        )
        .select("id")
        .maybeSingle();
      if (entryError) throw new Error(entryError.message);
      if (!entry) {
        results.push({ title: row.title, outcome: "ja_existia" });
        continue;
      }

      for (const shelfName of shelfNames) {
        const shelfId = await ensureShelf(supabase, user.id, shelfName, shelfCache);
        if (!shelfId) continue;
        await supabase.from("shelf_entries").insert({
          shelf_id: shelfId,
          library_entry_id: entry.id,
          user_id: user.id,
        });
      }

      if (sessionStatus) {
        const concluded = sessionStatus === "concluida";
        const { error: sessionError } = await supabase.from("reading_sessions").insert({
          library_entry_id: entry.id,
          user_id: user.id,
          sequence_number: 1,
          status: sessionStatus,
          format: formatFromBinding(row.binding),
          started_at: null,
          finished_at: sessionStatus === "em_andamento" ? null : row.dateRead,
          rating_half: concluded && row.rating > 0 ? row.rating * 2 : null,
          review: concluded && row.review ? row.review : null,
        });
        if (sessionError) throw new Error(sessionError.message);
      }

      results.push({ title: row.title, outcome: "importado", source });
    } catch (err) {
      results.push({
        title: row.title,
        outcome: "erro",
        detail: err instanceof Error ? err.message : "Erro desconhecido",
      });
    }
  }

  revalidatePath("/library");
  revalidatePath("/vitrine");
  return results;
}
