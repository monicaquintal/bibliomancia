"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createShelfSchema,
  deleteShelfSchema,
  toggleShelfEntrySchema,
} from "@/lib/validation";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createShelf(formData: FormData) {
  const parsed = createShelfSchema.safeParse({
    name: formData.get("name"),
    entryId: formData.get("entryId") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { supabase, user } = await requireUser();
  const { data: shelf, error } = await supabase
    .from("shelves")
    .insert({ user_id: user.id, name: parsed.data.name })
    .select("id")
    .single();
  if (error || !shelf) {
    throw new Error(
      error?.code === "23505" ? "Você já tem uma estante com esse nome" : "Erro ao criar estante",
    );
  }

  if (parsed.data.entryId) {
    await supabase.from("shelf_entries").insert({
      shelf_id: shelf.id,
      library_entry_id: parsed.data.entryId,
      user_id: user.id,
    });
    revalidatePath(`/library/${parsed.data.entryId}`);
  }
  revalidatePath("/library");
  revalidatePath("/vitrine");
}

export async function deleteShelf(formData: FormData) {
  const parsed = deleteShelfSchema.safeParse({ shelfId: formData.get("shelfId") });
  if (!parsed.success) throw new Error("Dados inválidos");

  const { supabase, user } = await requireUser();
  await supabase.from("shelves").delete().eq("id", parsed.data.shelfId).eq("user_id", user.id);

  revalidatePath("/library");
  revalidatePath("/vitrine");
  redirect("/library");
}

export async function toggleShelfEntry(formData: FormData) {
  const parsed = toggleShelfEntrySchema.safeParse({
    entryId: formData.get("entryId"),
    shelfId: formData.get("shelfId"),
    member: formData.get("member"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const { supabase, user } = await requireUser();
  const { entryId, shelfId, member } = parsed.data;

  if (member === "1") {
    await supabase
      .from("shelf_entries")
      .upsert(
        { shelf_id: shelfId, library_entry_id: entryId, user_id: user.id },
        { onConflict: "shelf_id,library_entry_id", ignoreDuplicates: true },
      );
  } else {
    await supabase
      .from("shelf_entries")
      .delete()
      .eq("shelf_id", shelfId)
      .eq("library_entry_id", entryId)
      .eq("user_id", user.id);
  }

  revalidatePath("/library");
  revalidatePath("/vitrine");
  revalidatePath(`/library/${entryId}`);
}
