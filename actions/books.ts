"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVolumeById, type NormalizedVolume } from "@/lib/google-books";
import { upsertBook } from "@/lib/books-cache";
import { addBookSchema, deleteLibraryEntrySchema, manualBookSchema } from "@/lib/validation";

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

  const { id: bookId, error: bookError } = await upsertBook(supabase, volume);
  if (bookError || !bookId) {
    throw new Error(bookError ?? "Não foi possível salvar o livro");
  }

  const { data: entry } = await supabase
    .from("library_entries")
    .upsert(
      { user_id: user.id, book_id: bookId, status_id: wantStatus.id },
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
    .eq("book_id", bookId)
    .single();

  const entryId = entry?.id ?? existingEntry?.id;
  if (entryId) {
    redirect(`/library/${entryId}`);
  }
  redirect("/library");
}

export async function deleteLibraryEntry(formData: FormData) {
  const parsed = deleteLibraryEntrySchema.safeParse({
    entryId: formData.get("entryId"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("library_entries")
    .delete()
    .eq("id", parsed.data.entryId)
    .eq("user_id", user.id);

  revalidatePath("/library");
  redirect("/library");
}

// Cadastro manual para livros que nenhum catálogo tem (edições raras, volumes de mangá etc.).
export async function addManualBook(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const parsed = manualBookSchema.safeParse({
    title: formData.get("title"),
    authors: formData.get("authors") || undefined,
    publisher: formData.get("publisher") || undefined,
    pageCount: formData.get("pageCount") || undefined,
    year: formData.get("year") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: wantStatus } = await supabase
    .from("reading_statuses")
    .select("id")
    .is("user_id", null)
    .eq("key", "quero")
    .single();
  if (!wantStatus) return { error: "Status inicial não configurado" };

  const { title, authors, publisher, pageCount, year } = parsed.data;
  const volume: NormalizedVolume = {
    googleVolumeId: `manual:${crypto.randomUUID()}`,
    isbn10: null,
    isbn13: null,
    title,
    subtitle: null,
    authors: authors
      ? authors
          .split(/[,;]/)
          .map((a) => a.trim())
          .filter(Boolean)
      : [],
    publisher: publisher ?? null,
    publishedDate: year ? String(year) : null,
    publishedYear: year ?? null,
    description: null,
    pageCount: pageCount ?? null,
    language: null,
    thumbnailUrl: null,
    categories: [],
    averageRating: null,
    ratingsCount: null,
  };

  const { id: bookId, error: bookError } = await upsertBook(supabase, volume);
  if (bookError || !bookId) return { error: bookError ?? "Não foi possível salvar o livro" };

  const { data: entry, error: entryError } = await supabase
    .from("library_entries")
    .insert({ user_id: user.id, book_id: bookId, status_id: wantStatus.id })
    .select("id")
    .single();
  if (entryError || !entry) return { error: entryError?.message ?? "Erro ao adicionar à estante" };

  revalidatePath("/library");
  revalidatePath("/vitrine");
  redirect(`/library/${entry.id}`);
}
