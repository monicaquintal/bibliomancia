import type { createClient } from "@/lib/supabase/server";
import { toLocalDay, type CalendarDay } from "@/components/ReadingCalendar";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Dias de leitura: início e término de cada leitura + comentários de progresso.
export async function loadReadingCalendar(supabase: Supabase, userId: string) {
  const [{ data: sessions }, { data: comments }] = await Promise.all([
    supabase
      .from("reading_sessions")
      .select("started_at, finished_at, library_entries(books(title))")
      .eq("user_id", userId),
    supabase
      .from("reading_comments")
      .select("created_at, reading_sessions(library_entries(books(title)))")
      .eq("user_id", userId),
  ]);

  const dayMap = new Map<string, { count: number; titles: Set<string> }>();
  const addDay = (day: string | null, title?: string) => {
    if (!day) return;
    const entry = dayMap.get(day) ?? { count: 0, titles: new Set<string>() };
    entry.count += 1;
    if (title) entry.titles.add(title);
    dayMap.set(day, entry);
  };
  for (const s of sessions ?? []) {
    const title = s.library_entries?.books?.title;
    addDay(s.started_at, title);
    addDay(s.finished_at, title);
  }
  for (const c of comments ?? []) {
    addDay(toLocalDay(c.created_at), c.reading_sessions?.library_entries?.books?.title);
  }

  const days: CalendarDay[] = [...dayMap.entries()].map(([day, v]) => ({
    day,
    count: v.count,
    titles: [...v.titles],
  }));
  const today = toLocalDay(new Date().toISOString());
  const years = [
    ...new Set([Number(today.slice(0, 4)), ...days.map((d) => Number(d.day.slice(0, 4)))]),
  ].sort((a, b) => b - a);

  return { days, today, years };
}
