import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toLocalDay } from "@/components/ReadingCalendar";
import { ConfirmButton } from "@/components/ConfirmButton";
import { MarathonForm } from "@/components/MarathonForm";
import { MarathonProgressBar } from "@/components/MarathonProgressBar";
import {
  addChallenge,
  addLibraryChallenge,
  addMarathonBook,
  deleteMarathon,
  removeMarathonBook,
} from "@/actions/marathons";
import { ChallengeList, type ChallengeView } from "@/components/ChallengeList";
import { bookNote, formatPeriod, marathonProgress } from "@/lib/marathons";

export default async function MarathonPage({
  params,
}: {
  params: Promise<{ marathonId: string }>;
}) {
  const { marathonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: marathon }, { data: links }, { data: entries }, { data: sessions }, { data: challengeRows }, { data: library }] =
    await Promise.all([
      supabase
        .from("marathons")
        .select("id, name, description, starts_on, ends_on, target_books, cover_url")
        .eq("id", marathonId)
        .eq("user_id", user!.id)
        .maybeSingle(),
      supabase
        .from("marathon_entries")
        .select(
          "library_entry_id, library_entries(id, books(title, authors, thumbnail_url), reading_statuses(key), reading_sessions(status, finished_at))",
        )
        .eq("marathon_id", marathonId)
        .order("created_at", { ascending: true }),
      supabase
        .from("library_entries")
        .select("id, books(title, authors)")
        .eq("user_id", user!.id),
      supabase
        .from("reading_sessions")
        .select("finished_at")
        .eq("user_id", user!.id)
        .eq("status", "concluida")
        .not("finished_at", "is", null),
      supabase
        .from("marathon_challenges")
        .select(
          "id, title, position, library_entry_id, challenge_id, library_entries(id, books(title, authors, thumbnail_url), reading_statuses(key), reading_sessions(status, finished_at))",
        )
        .eq("marathon_id", marathonId)
        .order("position", { ascending: true }),
      // biblioteca de desafios: os do catálogo e os seus (a RLS filtra)
      supabase.from("challenges").select("id, title, user_id").order("title", { ascending: true }),
    ]);

  if (!marathon) notFound();

  const today = toLocalDay(new Date().toISOString());
  const toProgressInput = (b: {
    reading_sessions: { status: string; finished_at: string | null }[] | null;
    reading_statuses: { key: string } | null;
  }) => ({ sessions: b.reading_sessions ?? [], statusKey: b.reading_statuses?.key ?? null });
  const books = (links ?? []).flatMap((l) => (l.library_entries ? [l.library_entries] : []));
  const challenges = challengeRows ?? [];
  const emptyInput = { sessions: [], statusKey: null };
  // com desafios, cada desafio conta como um "livro"; sem livro atribuído, ainda não lido
  const progress = marathonProgress(
    marathon,
    challenges.length > 0
      ? challenges.map((c) => (c.library_entries ? toProgressInput(c.library_entries) : emptyInput))
      : books.map(toProgressInput),
    (sessions ?? []).map((s) => s.finished_at as string),
    today,
  );

  const challengeViews: ChallengeView[] = challenges.map((c) => {
    const e = c.library_entries;
    return {
      id: c.id,
      title: c.title,
      book:
        e && e.books
          ? {
              entryId: e.id,
              title: e.books.title,
              authors: e.books.authors ?? [],
              thumbnailUrl: e.books.thumbnail_url,
              done: marathonProgress(marathon, [toProgressInput(e)], [], today).done === 1,
              note: bookNote(marathon, toProgressInput(e)),
            }
          : null,
    };
  });
  const linkedChallengeIds = new Set(challenges.map((c) => c.challenge_id).filter(Boolean));
  const libraryOptions = (library ?? []).filter((c) => !linkedChallengeIds.has(c.id));
  const usedInChallenges = new Set(challenges.map((c) => c.library_entry_id).filter(Boolean));
  const challengeOptions = (entries ?? [])
    .filter((e) => e.books && !usedInChallenges.has(e.id))
    .sort((a, b) => a.books!.title.localeCompare(b.books!.title, "pt-BR"))
    .map((e) => ({
      id: e.id,
      label: `${e.books!.title}${e.books!.authors?.length ? ` — ${e.books!.authors.join(", ")}` : ""}`,
    }));

  const inMarathon = new Set(books.map((b) => b.id));
  const candidates = (entries ?? [])
    .filter((e) => e.books && !inMarathon.has(e.id))
    .sort((a, b) => a.books!.title.localeCompare(b.books!.title, "pt-BR"));

  const isDone = (book: (typeof books)[number]) =>
    marathonProgress(marathon, [toProgressInput(book)], [], today).done === 1;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/maratonas" className="text-sm text-ink-soft hover:text-ink">
          ← Maratonas
        </Link>
        {marathon.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={marathon.cover_url}
            alt=""
            className="mt-3 h-40 w-full max-w-md rounded-lg object-cover"
          />
        )}
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">{marathon.name}</h1>
        {formatPeriod(marathon) && (
          <p className="mt-1 text-sm text-ink-soft">{formatPeriod(marathon)}</p>
        )}
        {marathon.description && (
          <p className="mt-2 max-w-2xl whitespace-pre-line text-sm text-ink-soft">
            {marathon.description}
          </p>
        )}
      </div>

      <MarathonForm marathon={marathon} />

      <div className="rounded-lg border border-dust-line bg-paper-raised p-4">
        <MarathonProgressBar progress={progress} />
        {books.length === 0 && challenges.length === 0 && (
          <p className="mt-3 text-xs text-ink-soft">
            {marathon.starts_on || marathon.ends_on
              ? "Sem lista de livros: contamos os livros que você terminar dentro do período."
              : "Adicione livros abaixo para acompanhar o progresso."}
          </p>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold text-ink">Desafios</h2>
        {challenges.length === 0 && (
          <p className="text-sm text-ink-soft">
            Adicione desafios da biblioteca, como “livro com a letra A” ou “capa azul”, e preencha
            cada um com um livro seu. Se preferir, use só a lista de livros mais abaixo.
          </p>
        )}

        <ChallengeList marathonId={marathon.id} challenges={challengeViews} options={challengeOptions} />

        <form action={addLibraryChallenge} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="marathonId" value={marathon.id} />
          <select
            name="challengeId"
            required
            defaultValue=""
            aria-label="Desafio da biblioteca"
            className="max-w-full rounded-lg border border-dust-line bg-paper px-2.5 py-1.5 text-sm focus:border-cover focus:outline-none"
          >
            <option value="" disabled>
              Adicionar desafio da biblioteca…
            </option>
            {(["mine", "catalog"] as const).map((group) => {
              const items = libraryOptions.filter((c) => (group === "mine") === (c.user_id !== null));
              if (items.length === 0) return null;
              return (
                <optgroup key={group} label={group === "mine" ? "Meus desafios" : "Do catálogo"}>
                  {items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <button
            type="submit"
            className="rounded-lg border border-dust-line px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
          >
            Adicionar
          </button>
        </form>

        <form action={addChallenge} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="marathonId" value={marathon.id} />
          <input
            name="title"
            required
            maxLength={120}
            aria-label="Criar desafio novo"
            placeholder="Ou crie um desafio novo (ex: livro de um autor brasileiro)"
            className="w-full max-w-sm rounded-lg border border-dust-line bg-paper px-2.5 py-1.5 text-sm focus:border-cover focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg border border-dust-line px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
          >
            Criar e adicionar
          </button>
        </form>
        <p className="text-xs text-ink-soft">
          Os desafios ficam na sua{" "}
          <Link href="/maratonas/desafios" className="underline hover:text-ink">
            biblioteca de desafios
          </Link>{" "}
          e podem entrar em qualquer maratona.
        </p>
      </section>

      {challenges.length === 0 && (
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-semibold text-ink">Livros da maratona</h2>

        {books.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {books.map((entry) => {
              const done = isDone(entry);
              return (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg border border-dust-line bg-paper-raised p-3"
                >
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded-sm bg-dust-line">
                    {entry.books?.thumbnail_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={entry.books.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/library/${entry.id}`}
                      className="line-clamp-2 font-serif text-sm font-medium text-ink hover:underline"
                    >
                      {entry.books?.title}
                    </Link>
                    <p className="truncate text-xs text-ink-soft">
                      {entry.books?.authors?.join(", ")}
                    </p>
                    <p className={`text-xs ${done ? "font-medium text-cover" : "text-ink-soft"}`}>
                      {bookNote(marathon, toProgressInput(entry))}
                    </p>
                  </div>
                  <form action={removeMarathonBook}>
                    <input type="hidden" name="marathonId" value={marathon.id} />
                    <input type="hidden" name="entryId" value={entry.id} />
                    <button
                      type="submit"
                      aria-label={`Tirar ${entry.books?.title} da maratona`}
                      className="px-2 text-lg leading-none text-ink-soft hover:text-berry"
                    >
                      ×
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        {candidates.length > 0 ? (
          <form action={addMarathonBook} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="marathonId" value={marathon.id} />
            <select
              name="entryId"
              required
              defaultValue=""
              aria-label="Livro da sua estante"
              className="max-w-full rounded-lg border border-dust-line bg-paper px-2.5 py-1.5 text-sm focus:border-cover focus:outline-none"
            >
              <option value="" disabled>
                Adicionar livro da estante…
              </option>
              {candidates.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.books!.title}
                  {e.books!.authors?.length ? ` — ${e.books!.authors.join(", ")}` : ""}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-dust-line px-2.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
            >
              Adicionar
            </button>
          </form>
        ) : (
          <p className="text-sm text-ink-soft">
            Todos os livros da sua estante já estão aqui.{" "}
            <Link href="/search" className="font-medium text-cover underline">
              Buscar outro livro
            </Link>
          </p>
        )}
      </section>
      )}

      <form action={deleteMarathon}>
        <input type="hidden" name="marathonId" value={marathon.id} />
        <ConfirmButton
          confirmMessage={`Excluir a maratona "${marathon.name}"? Os livros continuam na sua estante.`}
          className="text-sm text-ink-soft underline hover:text-berry"
        >
          Excluir maratona
        </ConfirmButton>
      </form>
    </div>
  );
}
