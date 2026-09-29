import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { statusTone } from "@/lib/status-colors";
import { ReadingGoalCard } from "@/components/ReadingGoalCard";
import { ReadingCalendar } from "@/components/ReadingCalendar";
import { loadReadingCalendar } from "@/lib/reading-calendar";

const FORMAT_LABEL: Record<string, string> = {
  livro: "Livro físico",
  ebook: "Ebook",
  audiobook: "Audiobook",
  outro: "Sem formato",
};

// Reusa os mesmos tons de `statusTone` (já usados na estante) para manter
// a paleta do app consistente, em vez de inventar cores novas por seção.
const FORMAT_TONE_KEY: Record<string, string> = {
  livro: "lendo",
  ebook: "quero",
  audiobook: "abandonado",
  outro: "tenho",
};

function daysBetween(startIso: string, endIso: string) {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dust-line bg-paper-raised p-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-sm text-ink-soft" title={label}>
        {label}
      </span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-6 shrink-0 text-right text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentYear = new Date().getFullYear();

  const [{ data: sessions }, { data: goal }, calendar] = await Promise.all([
    supabase
      .from("reading_sessions")
      .select(
        "status, format, started_at, finished_at, rating, library_entries(book_id, books(title, authors, page_count))",
      )
      .eq("user_id", user!.id),
    supabase
      .from("reading_goals")
      .select("target_books")
      .eq("user_id", user!.id)
      .eq("year", currentYear)
      .maybeSingle(),
    loadReadingCalendar(supabase, user!.id),
  ]);

  const rows = sessions ?? [];

  const concluded = rows
    .filter(
      (
        s,
      ): s is typeof s & {
        finished_at: string;
        library_entries: NonNullable<(typeof rows)[number]["library_entries"]> & {
          books: NonNullable<NonNullable<(typeof rows)[number]["library_entries"]>["books"]>;
        };
      } => s.status === "concluida" && !!s.finished_at && !!s.library_entries?.books,
    )
    .map((s) => ({
      bookId: s.library_entries.book_id,
      title: s.library_entries.books.title,
      authors: s.library_entries.books.authors ?? [],
      pageCount: s.library_entries.books.page_count,
      format: s.format,
      finishedAt: s.finished_at,
      startedAt: s.started_at,
      rating: s.rating,
    }));

  const reading = rows.filter((s) => s.status === "em_andamento").length;
  const abandoned = rows.filter((s) => s.status === "abandonada").length;

  const booksThisYear = concluded.filter(
    (c) => c.finishedAt.slice(0, 4) === String(currentYear),
  ).length;

  const distinctBooks = new Set(concluded.map((c) => c.bookId)).size;
  const rereads = concluded.length - distinctBooks;

  const totalPages = concluded.reduce((sum, c) => sum + (c.pageCount ?? 0), 0);

  const rated = concluded.filter((c) => c.rating != null);
  const avgRating =
    rated.length > 0 ? rated.reduce((sum, c) => sum + Number(c.rating), 0) / rated.length : null;

  const timed = concluded.filter((c) => c.startedAt);
  const avgDays =
    timed.length > 0
      ? Math.round(
          timed.reduce((sum, c) => sum + daysBetween(c.startedAt!, c.finishedAt), 0) /
            timed.length,
        )
      : null;

  const byYear = new Map<string, number>();
  for (const c of concluded) {
    const year = c.finishedAt.slice(0, 4);
    byYear.set(year, (byYear.get(year) ?? 0) + 1);
  }
  const years = [...byYear.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const maxYearCount = Math.max(0, ...years.map(([, n]) => n));

  const formatCounts = new Map<string, number>();
  for (const c of concluded) {
    const key = c.format ?? "outro";
    formatCounts.set(key, (formatCounts.get(key) ?? 0) + 1);
  }
  const formats = [...formatCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxFormatCount = Math.max(0, ...formats.map(([, n]) => n));

  const authorCounts = new Map<string, number>();
  for (const c of concluded) {
    for (const author of c.authors) {
      authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1);
    }
  }
  const topAuthors = [...authorCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5);
  const maxAuthorCount = Math.max(0, ...topAuthors.map(([, n]) => n));

  const requestedYear = Number(ano);
  const calendarYear = calendar.years.includes(requestedYear) ? requestedYear : null;

  const hasAnyData = concluded.length > 0 || reading > 0 || abandoned > 0;

  if (!hasAnyData) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Estatísticas</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Um retrato em números da sua jornada de leitura.
          </p>
        </div>

        <ReadingGoalCard year={currentYear} target={goal?.target_books ?? null} progress={booksThisYear} />

        <div className="rounded-lg border border-dust-line bg-paper-raised p-8 text-center">
          <p className="text-sm text-ink-soft">
            Ainda não há nada para contar por aqui. Comece uma leitura na sua{" "}
            <Link href="/library" className="text-cover underline underline-offset-2">
              estante
            </Link>{" "}
            e volte depois — os números aparecem sozinhos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Estatísticas</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Um retrato em números da sua jornada de leitura.
        </p>
      </div>

      <ReadingGoalCard year={currentYear} target={goal?.target_books ?? null} progress={booksThisYear} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          label="Livros lidos"
          value={String(distinctBooks)}
          hint={rereads > 0 ? `+${rereads} releitura${rereads === 1 ? "" : "s"}` : undefined}
        />
        <StatTile
          label="Páginas viradas"
          value={totalPages > 0 ? totalPages.toLocaleString("pt-BR") : "—"}
        />
        <StatTile
          label="Nota média"
          value={avgRating != null ? avgRating.toFixed(1) : "—"}
          hint={avgRating != null ? "de 5 estrelas" : undefined}
        />
        <StatTile
          label="Ritmo médio"
          value={avgDays != null ? `${avgDays}` : "—"}
          hint={avgDays != null ? `dia${avgDays === 1 ? "" : "s"} por livro` : undefined}
        />
        <StatTile label="Lendo agora" value={String(reading)} />
      </section>

      {years.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-semibold text-ink">Livros por ano</h2>
          <div className="space-y-2 rounded-lg border border-dust-line bg-paper-raised p-4">
            {years.map(([year, count]) => (
              <Bar
                key={year}
                label={year}
                value={count}
                max={maxYearCount}
                color="var(--cover)"
              />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {formats.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-ink">Formato preferido</h2>
            <div className="space-y-2 rounded-lg border border-dust-line bg-paper-raised p-4">
              {formats.map(([format, count]) => (
                <Bar
                  key={format}
                  label={FORMAT_LABEL[format] ?? format}
                  value={count}
                  max={maxFormatCount}
                  color={statusTone(FORMAT_TONE_KEY[format] ?? "tenho").dot}
                />
              ))}
            </div>
          </section>
        )}

        {topAuthors.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-serif text-lg font-semibold text-ink">Autores mais lidos</h2>
            <div className="space-y-2 rounded-lg border border-dust-line bg-paper-raised p-4">
              {topAuthors.map(([author, count]) => (
                <Bar
                  key={author}
                  label={author}
                  value={count}
                  max={maxAuthorCount}
                  color="var(--night)"
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <ReadingCalendar
        days={calendar.days}
        today={calendar.today}
        year={calendarYear}
        years={calendar.years}
      />

      {abandoned > 0 && (
        <p className="text-sm text-ink-soft">
          E {abandoned} {abandoned === 1 ? "leitura ficou" : "leituras ficaram"} pelo caminho —
          sem culpa, nem todo livro é pra agora.
        </p>
      )}
    </div>
  );
}
