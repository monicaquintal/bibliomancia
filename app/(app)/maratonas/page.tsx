import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { toLocalDay } from "@/components/ReadingCalendar";
import { MarathonProgressBar } from "@/components/MarathonProgressBar";
import { MarathonForm } from "@/components/MarathonForm";
import { StickyNote } from "@/components/StickyNote";
import { joinCatalogMarathon } from "@/actions/marathons";
import { formatPeriod, marathonProgress, type BookProgressInput } from "@/lib/marathons";

type EntryData = {
  books: { thumbnail_url: string | null } | null;
  reading_statuses: { key: string } | null;
  reading_sessions: { status: string; finished_at: string | null }[] | null;
} | null;

const toInput = (e: EntryData): BookProgressInput => ({
  sessions: e?.reading_sessions ?? [],
  statusKey: e?.reading_statuses?.key ?? null,
});

export default async function MarathonsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const entryFields = "books(thumbnail_url), reading_statuses(key), reading_sessions(status, finished_at)";
  const [{ data: marathons }, { data: sessions }, { data: catalog }] = await Promise.all([
    supabase
      .from("marathons")
      .select(
        `id, name, description, starts_on, ends_on, target_books, catalog_key, cover_url,
         marathon_entries(library_entries(${entryFields})),
         marathon_challenges(position, library_entries(${entryFields}))`,
      )
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reading_sessions")
      .select("finished_at")
      .eq("user_id", user!.id)
      .eq("status", "concluida")
      .not("finished_at", "is", null),
    supabase
      .from("catalog_marathons")
      .select("key, name, description, catalog_marathon_challenges(position, challenges(title))")
      .order("sort_order", { ascending: true }),
  ]);

  const today = toLocalDay(new Date().toISOString());
  const concludedDays = (sessions ?? []).map((s) => s.finished_at as string);

  const cards = (marathons ?? []).map((m) => {
    // com desafios, cada desafio é um "livro" da conta (sem livro atribuído = ainda não lido)
    const entries: EntryData[] =
      (m.marathon_challenges ?? []).length > 0
        ? [...m.marathon_challenges]
            .sort((a, b) => a.position - b.position)
            .map((c) => c.library_entries)
        : (m.marathon_entries ?? []).map((e) => e.library_entries);
    return {
      ...m,
      covers: entries.map((e) => e?.books?.thumbnail_url).filter((u): u is string => !!u).slice(0, 4),
      progress: marathonProgress(m, entries.map(toInput), concludedDays, today),
    };
  });
  const joined = new Set(cards.map((c) => c.catalog_key).filter(Boolean));
  // abertas primeiro, encerradas por último
  const order = { aberta: 0, futura: 1, encerrada: 2 };
  cards.sort((a, b) => order[a.progress.phase] - order[b.progress.phase]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Maratonas</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Desafios de leitura só seus: uma série inteira, três livros em maio, um livro para cada
          letra do alfabeto. <span className="highlight">Sem ranking, sem ninguém olhando.</span>
        </p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <MarathonForm />
        </div>
        <Link
          href="/maratonas/desafios"
          className="text-sm font-medium text-ink-soft underline hover:text-ink"
        >
          Biblioteca de desafios →
        </Link>
      </div>

      {cards.length === 0 ? (
        <StickyNote>nenhuma maratona por aqui ainda. que tal começar a primeira?</StickyNote>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((m) => (
            <li key={m.id}>
              <Link
                href={`/maratonas/${m.id}`}
                className="flex h-full flex-col overflow-hidden rounded-lg border border-dust-line bg-paper-raised transition-colors hover:border-ink-soft"
              >
                {m.cover_url ? (
                  <div className="h-40 bg-night/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.cover_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-40 items-end justify-center bg-night/10 px-4 pt-4">
                  {m.covers.length > 0 ? (
                    <div className="flex -space-x-6">
                      {m.covers.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url + i}
                          src={url}
                          alt=""
                          loading="lazy"
                          className={`h-32 w-[5.5rem] rounded-sm object-cover shadow-[0_6px_10px_-4px_rgba(46,39,32,0.5)] ${
                            i % 2 === 0 ? "-rotate-3" : "rotate-2"
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <span aria-hidden className="pb-6 font-hand text-2xl text-ink-soft">
                      sem capas ainda
                    </span>
                  )}
                </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-ink">{m.name}</h2>
                    {formatPeriod(m) && <p className="text-xs text-ink-soft">{formatPeriod(m)}</p>}
                    {m.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{m.description}</p>
                    )}
                  </div>
                  <div className="mt-auto">
                    <MarathonProgressBar progress={m.progress} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {catalog && catalog.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">Explorar maratonas</h2>
            <p className="text-sm text-ink-soft">
              Maratonas prontas para você participar. Ao participar, você ganha a sua própria
              cópia, com o seu progresso, e pode mudar o que quiser.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((c) => {
              const items = [...c.catalog_marathon_challenges].sort((a, b) => a.position - b.position);
              return (
                <li
                  key={c.key}
                  className="flex flex-col gap-3 rounded-lg border border-dust-line bg-paper-raised p-4"
                >
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-ink">{c.name}</h3>
                    <p className="text-xs text-ink-soft">{items.length} desafios</p>
                    {c.description && <p className="mt-1 text-sm text-ink-soft">{c.description}</p>}
                  </div>
                  <ul className="space-y-0.5 text-xs text-ink-soft">
                    {items.slice(0, 3).map((item) => (
                      <li key={item.position}>• {item.challenges?.title}</li>
                    ))}
                    {items.length > 3 && <li>• …</li>}
                  </ul>
                  <form action={joinCatalogMarathon} className="mt-auto flex items-center gap-3">
                    <input type="hidden" name="key" value={c.key} />
                    <button
                      type="submit"
                      className="rounded-lg bg-cover px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark"
                    >
                      Participar
                    </button>
                    {joined.has(c.key) && (
                      <span className="text-xs text-ink-soft">você já tem uma</span>
                    )}
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
