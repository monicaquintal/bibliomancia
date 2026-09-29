"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createMarathonSchema,
  marathonBookSchema,
  marathonIdSchema,
} from "@/lib/validation";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createMarathon(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const field = (name: string) => (formData.get(name) as string | null) || undefined;
  const parsed = createMarathonSchema.safeParse({
    name: formData.get("name"),
    description: field("description"),
    startsOn: field("startsOn"),
    endsOn: field("endsOn"),
    targetBooks: field("targetBooks"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("marathons")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      starts_on: parsed.data.startsOn ?? null,
      ends_on: parsed.data.endsOn ?? null,
      target_books: parsed.data.targetBooks ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Erro ao criar maratona" };

  revalidatePath("/maratonas");
  redirect(`/maratonas/${data.id}`);
}

export async function updateMarathon(
  _prev: { error: string | null; saved?: boolean },
  formData: FormData,
): Promise<{ error: string | null; saved?: boolean }> {
  const field = (name: string) => (formData.get(name) as string | null) || undefined;
  const id = marathonIdSchema.safeParse({ marathonId: formData.get("marathonId") });
  const parsed = createMarathonSchema.safeParse({
    name: formData.get("name"),
    description: field("description"),
    startsOn: field("startsOn"),
    endsOn: field("endsOn"),
    targetBooks: field("targetBooks"),
  });
  if (!id.success) return { error: "Maratona inválida" };
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await requireUser();
  // campos esvaziados no formulário viram null (apagam o valor antigo)
  const { error } = await supabase
    .from("marathons")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      starts_on: parsed.data.startsOn ?? null,
      ends_on: parsed.data.endsOn ?? null,
      target_books: parsed.data.targetBooks ?? null,
    })
    .eq("id", id.data.marathonId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/maratonas");
  revalidatePath(`/maratonas/${id.data.marathonId}`);
  return { error: null, saved: true };
}

export async function deleteMarathon(formData: FormData) {
  const parsed = marathonIdSchema.safeParse({ marathonId: formData.get("marathonId") });
  if (!parsed.success) throw new Error("Dados inválidos");

  const { supabase, user } = await requireUser();
  await supabase.from("marathons").delete().eq("id", parsed.data.marathonId).eq("user_id", user.id);

  revalidatePath("/maratonas");
  redirect("/maratonas");
}

export async function addMarathonBook(formData: FormData) {
  const parsed = marathonBookSchema.safeParse({
    marathonId: formData.get("marathonId"),
    entryId: formData.get("entryId"),
  });
  if (!parsed.success) throw new Error("Escolha um livro");

  const { supabase, user } = await requireUser();
  const { marathonId, entryId } = parsed.data;

  // só aceita livros da própria estante
  const { data: entry } = await supabase
    .from("library_entries")
    .select("id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!entry) throw new Error("Livro não encontrado na sua estante");

  await supabase
    .from("marathon_entries")
    .upsert(
      { marathon_id: marathonId, library_entry_id: entryId, user_id: user.id },
      { onConflict: "marathon_id,library_entry_id", ignoreDuplicates: true },
    );

  revalidatePath("/maratonas");
  revalidatePath(`/maratonas/${marathonId}`);
}

export async function removeMarathonBook(formData: FormData) {
  const parsed = marathonBookSchema.safeParse({
    marathonId: formData.get("marathonId"),
    entryId: formData.get("entryId"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const { supabase, user } = await requireUser();
  const { marathonId, entryId } = parsed.data;
  await supabase
    .from("marathon_entries")
    .delete()
    .eq("marathon_id", marathonId)
    .eq("library_entry_id", entryId)
    .eq("user_id", user.id);

  revalidatePath("/maratonas");
  revalidatePath(`/maratonas/${marathonId}`);
}
