"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { searchVolumes, type NormalizedVolume } from "@/lib/google-books";
import { formatFromBinding, isAbandonedShelf, shelfLabel } from "@/lib/goodreads";
import { importBatchSchema } from "@/lib/validation";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ImportOutcome = "importado" | "ja_existia" | "nao_encontrado" | "erro";

export interface ImportRowResult {
  title: string;
  outcome: ImportOutcome;
  detail?: string;
}

async function findVolume(row: {
  title: string;
  author: string;
  isbn10: string | null;
  isbn13: string | null;
}): Promise<NormalizedVolume | null> {
  for (const isbn of [row.isbn13, row.isbn10]) {
    if (!isbn) continue;
    const { items } = await searchVolumes(isbn, 0, 1);
    if (items[0]) return items[0];
  }
  // Goodreads acrescenta a série ao título: "Dom Casmurro (Coleção, #1)"
  const title = row.title.replace(/\s*\([^)]*\)\s*$/, "");
  const author = row.author.split(",")[0]?.trim();
  const query = `intitle:${JSON.stringify(title)}${author ? ` inauthor:${JSON.stringify(author)}` : ""}`;
  const { items } = await searchVolumes(query, 0, 1);
  return items[0] ?? null;
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
    try {
      const volume = await findVolume(row);
      if (!volume) {
        results.push({ title: row.title, outcome: "nao_encontrado" });
        continue;
      }

      const { data: book, error: bookError } = await supabase
        .from("books")
        .upsert(
          {
            google_volume_id: volume.googleVolumeId,
            isbn_10: volume.isbn10,
            isbn_13: volume.isbn13,
            title: volume.title,
            subtitle: volume.subtitle,
            authors: volume.authors,
            publisher: volume.publisher,
            published_date: volume.publishedDate,
            published_year: volume.publishedYear,
            description: volume.description,
            page_count: volume.pageCount,
            language: volume.language,
            thumbnail_url: volume.thumbnailUrl,
          },
          { onConflict: "google_volume_id" },
        )
        .select("id")
        .single();
      if (bookError || !book) throw new Error(bookError?.message ?? "Falha ao salvar o livro");

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
          { user_id: user.id, book_id: book.id, status_id: statusId },
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

      results.push({ title: row.title, outcome: "importado" });
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
