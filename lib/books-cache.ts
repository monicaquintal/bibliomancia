import type { createClient } from "@/lib/supabase/server";
import type { NormalizedVolume } from "@/lib/google-books";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Salva (ou atualiza) o livro no cache compartilhado e devolve o id interno.
export async function upsertBook(supabase: Supabase, volume: NormalizedVolume) {
  const { data, error } = await supabase
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
  return { id: data?.id ?? null, error: error?.message ?? null };
}
