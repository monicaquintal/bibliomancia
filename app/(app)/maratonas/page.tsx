import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { toLocalDay } from "@/components/ReadingCalendar";
import { MarathonProgressBar } from "@/components/MarathonProgressBar";
import { MarathonForm } from "@/components/MarathonForm";
import { formatPeriod, marathonProgress } from "@/lib/marathons";

export default async function MarathonsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: marathons }, { data: sessions }] = await Promise.all([
    supabase
      .from("marathons")
      .select(
        "id, name, description, starts_on, ends_on, target_books, marathon_entries(library_entries(reading_statuses(key), reading_sessions(status, finished_at)))",
      )
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reading_sessions")
      .select("finished_at")
      .eq("user_id", user!.id)
      .eq("status", "concluida")
      .not("finished_at", "is", null),
  ]);

  const today = toLocalDay(new Date().toISOString());
  const concludedDays = (sessions ?? []).map((s) => s.finished_at as string);

  const cards = (marathons ?? []).map((m) => ({
    ...m,
    progress: marathonProgress(
      m,
      (m.marathon_entries ?? []).map((e) => ({
        sessions: e.library_entries?.reading_sessions ?? [],
        statusKey: e.library_entries?.reading_statuses?.key ?? null,
      })),
      concludedDays,
      today,
    ),
  }));
  // abertas primeiro, encerradas por último
  const order = { aberta: 0, futura: 1, encerrada: 2 };
  cards.sort((a, b) => order[a.progress.phase] - order[b.progress.phase]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Maratonas</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Desafios de leitura só seus: uma série inteira, três livros em maio, um clássico por
          mês. Sem ranking, sem ninguém olhando.
        </p>
      </div>

      <MarathonForm />

      {cards.length === 0 ? (
        <p className="text-sm text-ink-soft">Você ainda não criou nenhuma maratona.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {cards.map((m) => (
            <li key={m.id}>
              <Link
                href={`/maratonas/${m.id}`}
                className="block space-y-3 rounded-lg border border-dust-line bg-paper-raised p-4 transition-colors hover:border-ink-soft"
              >
                <div>
                  <h2 className="font-serif text-lg font-semibold text-ink">{m.name}</h2>
                  {formatPeriod(m) && <p className="text-xs text-ink-soft">{formatPeriod(m)}</p>}
                  {m.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{m.description}</p>
                  )}
                </div>
                <MarathonProgressBar progress={m.progress} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
