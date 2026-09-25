"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVolumeById } from "@/lib/google-books";
import { addBookSchema } from "@/lib/validation";

export async function addBookToLibrary(formData: FormData) {
  const parsed = addBookSchema.safeParse({
    googleVolumeId: formData.get("googleVolumeId"),
  });
  if (!parsed.success) {
    throw new Error("Livro inválido");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [volume, { data: wantStatus }] = await Promise.all([
    getVolumeById(parsed.data.googleVolumeId),
    supabase
      .from("reading_statuses")
      .select("id")
      .is("user_id", null)
      .eq("key", "quero")
      .single(),
  ]);

  if (!wantStatus) {
    throw new Error("Status inicial não configurado");
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

  if (bookError || !book) {
    throw new Error(bookError?.message ?? "Não foi possível salvar o livro");
  }

  const { data: entry } = await supabase
    .from("library_entries")
    .upsert(
      { user_id: user.id, book_id: book.id, status_id: wantStatus.id },
      { onConflict: "user_id,book_id", ignoreDuplicates: true },
    )
    .select("id")
    .single();

  revalidatePath("/library");
  revalidatePath("/search");

  const { data: existingEntry } = await supabase
    .from("library_entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", book.id)
    .single();

  const entryId = entry?.id ?? existingEntry?.id;
  if (entryId) {
    redirect(`/library/${entryId}`);
  }
  redirect("/library");
}
