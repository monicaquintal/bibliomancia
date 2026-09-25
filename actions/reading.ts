"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  abandonSessionSchema,
  addCommentSchema,
  createCustomStatusSchema,
  finishSessionSchema,
  setRatingSchema,
  setReviewSchema,
  startSessionSchema,
  updateSessionDatesSchema,
  updateStatusSchema,
} from "@/lib/validation";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function slugify(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

async function getSystemStatusId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  key: string,
) {
  const { data } = await supabase
    .from("reading_statuses")
    .select("id")
    .is("user_id", null)
    .eq("key", key)
    .single();
  return data?.id ?? null;
}

export async function updateStatus(formData: FormData) {
  const parsed = updateStatusSchema.safeParse({
    entryId: formData.get("entryId"),
    statusId: formData.get("statusId"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const { supabase, user } = await requireUser();
  await supabase
    .from("library_entries")
    .update({ status_id: parsed.data.statusId, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.entryId)
    .eq("user_id", user.id);

  revalidatePath("/library");
  revalidatePath(`/library/${parsed.data.entryId}`);
}

export async function createCustomStatus(formData: FormData) {
  const parsed = createCustomStatusSchema.safeParse({ label: formData.get("label") });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { supabase, user } = await requireUser();
  const key = slugify(parsed.data.label) || `status_${Date.now()}`;

  const { error } = await supabase.from("reading_statuses").insert({
    user_id: user.id,
    key,
    label: parsed.data.label,
    is_system: false,
    sort_order: 100,
  });
  if (error) {
    throw new Error(
      error.code === "23505" ? "Você já tem um status com esse nome" : error.message,
    );
  }

  revalidatePath("/library");
}

export async function startReadingSession(formData: FormData) {
  const parsed = startSessionSchema.safeParse({
    entryId: formData.get("entryId"),
    startedAt: formData.get("startedAt") || undefined,
    format: formData.get("format"),
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const { supabase, user } = await requireUser();
  const { entryId } = parsed.data;

  const { data: lastSession } = await supabase
    .from("reading_sessions")
    .select("sequence_number")
    .eq("library_entry_id", entryId)
    .order("sequence_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSequence = (lastSession?.sequence_number ?? 0) + 1;
  const startedAt = parsed.data.startedAt ?? new Date().toISOString().slice(0, 10);

  await supabase.from("reading_sessions").insert({
    library_entry_id: entryId,
    user_id: user.id,
    sequence_number: nextSequence,
    status: "em_andamento",
    format: parsed.data.format,
    started_at: startedAt,
  });

  const lendoId = await getSystemStatusId(supabase, "lendo");
  if (lendoId) {
    await supabase
      .from("library_entries")
      .update({ status_id: lendoId, updated_at: new Date().toISOString() })
      .eq("id", entryId)
      .eq("user_id", user.id);
  }

  revalidatePath("/library");
  revalidatePath(`/library/${entryId}`);
}

export async function updateSessionDates(formData: FormData) {
  const parsed = updateSessionDatesSchema.safeParse({
    sessionId: formData.get("sessionId"),
    startedAt: formData.get("startedAt") || null,
    finishedAt: formData.get("finishedAt") || null,
  });
  if (!parsed.success) throw new Error("Dados inválidos");

  const { supabase, user } = await requireUser();
  const { data: session } = await supabase
    .from("reading_sessions")
    .update({
      started_at: parsed.data.startedAt,
      finished_at: parsed.data.finishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id)
    .select("library_entry_id")
    .single();

  if (session) revalidatePath(`/library/${session.library_entry_id}`);
  revalidatePath("/library");
}

export async function finishSession(formData: FormData) {
  const parsed = finishSessionSchema.safeParse({
    sessionId: formData.get("sessionId"),
    finishedAt: formData.get("finishedAt"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { supabase, user } = await requireUser();
  const { data: session } = await supabase
    .from("reading_sessions")
    .update({
      status: "concluida",
      finished_at: parsed.data.finishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id)
    .select("library_entry_id")
    .single();

  if (session) {
    const lidoId = await getSystemStatusId(supabase, "lido");
    if (lidoId) {
      await supabase
        .from("library_entries")
        .update({ status_id: lidoId, updated_at: new Date().toISOString() })
        .eq("id", session.library_entry_id)
        .eq("user_id", user.id);
    }
    revalidatePath(`/library/${session.library_entry_id}`);
  }
  revalidatePath("/library");
}

export async function abandonSession(formData: FormData) {
  const parsed = abandonSessionSchema.safeParse({ sessionId: formData.get("sessionId") });
  if (!parsed.success) throw new Error("Dados inválidos");

  const { supabase, user } = await requireUser();
  const { data: session } = await supabase
    .from("reading_sessions")
    .update({ status: "abandonada", updated_at: new Date().toISOString() })
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id)
    .select("library_entry_id")
    .single();

  if (session) {
    const abandonadoId = await getSystemStatusId(supabase, "abandonado");
    if (abandonadoId) {
      await supabase
        .from("library_entries")
        .update({ status_id: abandonadoId, updated_at: new Date().toISOString() })
        .eq("id", session.library_entry_id)
        .eq("user_id", user.id);
    }
    revalidatePath(`/library/${session.library_entry_id}`);
  }
  revalidatePath("/library");
}

export async function addComment(formData: FormData) {
  const parsed = addCommentSchema.safeParse({
    sessionId: formData.get("sessionId"),
    body: formData.get("body"),
    progressPage: formData.get("progressPage") || undefined,
    progressPercent: formData.get("progressPercent") || undefined,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { supabase, user } = await requireUser();
  const { data: session } = await supabase
    .from("reading_sessions")
    .select("library_entry_id, status")
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session || session.status !== "em_andamento") {
    throw new Error("Só é possível comentar durante uma leitura em andamento");
  }

  await supabase.from("reading_comments").insert({
    reading_session_id: parsed.data.sessionId,
    user_id: user.id,
    body: parsed.data.body,
    progress_page: parsed.data.progressPage ?? null,
    progress_percent: parsed.data.progressPercent ?? null,
  });

  revalidatePath(`/library/${session.library_entry_id}`);
}

export async function setRating(formData: FormData) {
  const parsed = setRatingSchema.safeParse({
    sessionId: formData.get("sessionId"),
    ratingHalf: formData.get("ratingHalf"),
  });
  if (!parsed.success) throw new Error("Nota inválida");

  const { supabase, user } = await requireUser();
  const { data: session, error } = await supabase
    .from("reading_sessions")
    .update({ rating_half: parsed.data.ratingHalf, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id)
    .select("library_entry_id")
    .single();

  if (error) {
    throw new Error("Só é possível avaliar uma leitura já concluída");
  }
  if (session) revalidatePath(`/library/${session.library_entry_id}`);
}

export async function setReview(formData: FormData) {
  const parsed = setReviewSchema.safeParse({
    sessionId: formData.get("sessionId"),
    review: formData.get("review"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { supabase, user } = await requireUser();
  const { data: session, error } = await supabase
    .from("reading_sessions")
    .update({ review: parsed.data.review, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.sessionId)
    .eq("user_id", user.id)
    .select("library_entry_id")
    .single();

  if (error) {
    throw new Error("Só é possível resenhar uma leitura já concluída");
  }
  if (session) revalidatePath(`/library/${session.library_entry_id}`);
}
