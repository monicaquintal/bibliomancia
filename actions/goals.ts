"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setReadingGoalSchema } from "@/lib/validation";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function setReadingGoal(formData: FormData) {
  const parsed = setReadingGoalSchema.safeParse({
    year: formData.get("year"),
    targetBooks: formData.get("targetBooks"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("reading_goals").upsert(
    {
      user_id: user.id,
      year: parsed.data.year,
      target_books: parsed.data.targetBooks,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,year" },
  );
  if (error) throw new Error(error.message);

  revalidatePath("/estatisticas");
}
