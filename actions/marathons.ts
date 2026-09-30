"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addChallengeSchema,
  assignChallengeSchema,
  challengeIdSchema,
  challengeTitleSchema,
  deleteChallengeSchema,
  joinCatalogSchema,
  libraryChallengeSchema,
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
    coverUrl: field("coverUrl"),
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
      cover_url: parsed.data.coverUrl ?? null,
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
    coverUrl: field("coverUrl"),
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
      cover_url: parsed.data.coverUrl ?? null,
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

async function nextPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  marathonId: string,
) {
  const { data } = await supabase
    .from("marathon_challenges")
    .select("position")
    .eq("marathon_id", marathonId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}

function revalidateMarathon(marathonId: string) {
  revalidatePath("/maratonas");
  revalidatePath(`/maratonas/${marathonId}`);
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Acha (ou cria) um desafio do usuário na biblioteca, sem diferenciar maiúsculas.
async function ensureOwnChallenge(supabase: Supabase, userId: string, title: string) {
  const { data: existing } = await supabase
    .from("challenges")
    .select("id, title")
    .eq("user_id", userId)
    .ilike("title", title.replace(/[\\%_]/g, "\\$&"))
    .maybeSingle();
  if (existing) return existing;
  const { data: created } = await supabase
    .from("challenges")
    .insert({ user_id: userId, title })
    .select("id, title")
    .single();
  return created;
}

// Coloca um desafio da biblioteca na maratona (uma vez só por maratona).
async function linkChallenge(
  supabase: Supabase,
  userId: string,
  marathonId: string,
  challenge: { id: string; title: string },
) {
  const { data: already } = await supabase
    .from("marathon_challenges")
    .select("id")
    .eq("marathon_id", marathonId)
    .eq("challenge_id", challenge.id)
    .maybeSingle();
  if (already) return;
  await supabase.from("marathon_challenges").insert({
    marathon_id: marathonId,
    user_id: userId,
    title: challenge.title,
    challenge_id: challenge.id,
    position: await nextPosition(supabase, marathonId),
  });
}

// Desafio novo: entra na biblioteca e já vai para a maratona.
export async function addChallenge(formData: FormData) {
  const parsed = addChallengeSchema.safeParse({
    marathonId: formData.get("marathonId"),
    title: formData.get("title"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { supabase, user } = await requireUser();
  const challenge = await ensureOwnChallenge(supabase, user.id, parsed.data.title);
  if (challenge) await linkChallenge(supabase, user.id, parsed.data.marathonId, challenge);
  revalidatePath("/maratonas/desafios");
  revalidateMarathon(parsed.data.marathonId);
}

// Desafio que já existe na biblioteca (do catálogo ou seu) entra na maratona.
export async function addLibraryChallenge(formData: FormData) {
  const parsed = libraryChallengeSchema.safeParse({
    marathonId: formData.get("marathonId"),
    challengeId: formData.get("challengeId"),
  });
  if (!parsed.success) throw new Error("Escolha um desafio");

  const { supabase, user } = await requireUser();
  // a RLS só devolve desafios do catálogo ou do próprio usuário
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, title")
    .eq("id", parsed.data.challengeId)
    .maybeSingle();
  if (!challenge) throw new Error("Desafio não encontrado");

  await linkChallenge(supabase, user.id, parsed.data.marathonId, challenge);
  revalidateMarathon(parsed.data.marathonId);
}

export async function createChallenge(formData: FormData) {
  const parsed = challengeTitleSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { supabase, user } = await requireUser();
  await ensureOwnChallenge(supabase, user.id, parsed.data.title);
  revalidatePath("/maratonas/desafios");
}

export async function deleteChallenge(formData: FormData) {
  const parsed = deleteChallengeSchema.safeParse({ challengeId: formData.get("challengeId") });
  if (!parsed.success) throw new Error("Dados inválidos");

  const { supabase, user } = await requireUser();
  // os itens que já estão em maratonas ficam (o título é copiado para lá)
  await supabase.from("challenges").delete().eq("id", parsed.data.challengeId).eq("user_id", user.id);
  revalidatePath("/maratonas/desafios");
}

// "Participar": cria uma maratona sua a partir de uma do catálogo, com os mesmos desafios.
export async function joinCatalogMarathon(formData: FormData) {
  const parsed = joinCatalogSchema.safeParse({ key: formData.get("key") });
  if (!parsed.success) throw new Error("Maratona inválida");

  const { supabase, user } = await requireUser();
  const { data: catalog } = await supabase
    .from("catalog_marathons")
    .select("name, description, key, catalog_marathon_challenges(position, challenges(id, title))")
    .eq("key", parsed.data.key)
    .maybeSingle();
  if (!catalog) throw new Error("Maratona não encontrada no catálogo");

  const { data: marathon, error } = await supabase
    .from("marathons")
    .insert({
      user_id: user.id,
      name: catalog.name,
      description: catalog.description,
      catalog_key: catalog.key,
    })
    .select("id")
    .single();
  if (error || !marathon) throw new Error(error?.message ?? "Erro ao criar maratona");

  const items = [...catalog.catalog_marathon_challenges].sort((a, b) => a.position - b.position);
  await supabase.from("marathon_challenges").insert(
    items.flatMap((item) =>
      item.challenges
        ? [
            {
              marathon_id: marathon.id,
              user_id: user.id,
              title: item.challenges.title,
              challenge_id: item.challenges.id,
              position: item.position,
            },
          ]
        : [],
    ),
  );

  revalidatePath("/maratonas");
  redirect(`/maratonas/${marathon.id}`);
}

export async function removeChallenge(formData: FormData) {
  const parsed = challengeIdSchema.safeParse({
    marathonId: formData.get("marathonId"),
    challengeId: formData.get("challengeId"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const { supabase, user } = await requireUser();
  await supabase
    .from("marathon_challenges")
    .delete()
    .eq("id", parsed.data.challengeId)
    .eq("user_id", user.id);
  revalidateMarathon(parsed.data.marathonId);
}

export async function assignChallengeBook(formData: FormData) {
  const parsed = assignChallengeSchema.safeParse({
    marathonId: formData.get("marathonId"),
    challengeId: formData.get("challengeId"),
    entryId: (formData.get("entryId") as string | null) || null,
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const { supabase, user } = await requireUser();
  const { marathonId, challengeId, entryId } = parsed.data;

  if (entryId) {
    // só aceita livros da própria estante
    const { data: entry } = await supabase
      .from("library_entries")
      .select("id")
      .eq("id", entryId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!entry) throw new Error("Livro não encontrado na sua estante");
  }

  await supabase
    .from("marathon_challenges")
    .update({ library_entry_id: entryId })
    .eq("id", challengeId)
    .eq("user_id", user.id);
  revalidateMarathon(marathonId);
}
