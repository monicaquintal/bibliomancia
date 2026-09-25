import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewCustomStatusForm } from "@/components/NewCustomStatusForm";
import { StatusGlyph } from "@/components/StatusGlyph";
import { statusTone } from "@/lib/status-colors";

const FORMAT_LABEL: Record<string, string> = {
  livro: "Livro físico",
  ebook: "Ebook",
  audiobook: "Audiobook",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: statuses }, { data: allEntries }] = await Promise.all([
    supabase
      .from("reading_statuses")
      .select("id, key, label, is_system, sort_order")
      .or(`user_id.is.null,user_id.eq.${user!.id}`)
      .order("sort_order", { ascending: true }),
    supabase
      .from("library_entries")
      .select(
        "id, status_id, books(title, authors, thumbnail_url), reading_statuses(key, label), reading_sessions(sequence_number, status, format, started_at, finished_at)",
      )
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false }),
  ]);

  const entries = statusFilter
    ? allEntries?.filter((e) => e.reading_statuses?.key === statusFilter)
    : allEntries;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Minha estante</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Os livros que você quer ler, está lendo, já leu — ou deixou de lado.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-dust-line pb-3 text-sm">
        <Link
          href="/library"
          className={`border-b-2 pb-1 font-medium transition-colors ${
            !statusFilter
              ? "border-ink text-ink"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          Todos
        </Link>
        {statuses?.map((status) => {
          const tone = statusTone(status.key);
          const active = statusFilter === status.key;
          return (
            <Link
              key={status.id}
              href={`/library?status=${status.key}`}
              className={`flex items-center gap-1.5 border-b-2 pb-1 font-medium transition-colors ${
                active ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
              style={{ borderBottomColor: active ? tone.dot : "transparent" }}
            >
              <StatusGlyph statusKey={status.key} maskColor="var(--paper)" className="h-3 w-3" />
              {status.label}
            </Link>
          );
        })}
      </div>

      <NewCustomStatusForm />

      {(!entries || entries.length === 0) && (
        <p className="text-sm text-ink-soft">
          Sua estante está vazia.{" "}
          <Link href="/search" className="font-medium text-cover underline">
            Que tal procurar o primeiro livro?
          </Link>
        </p>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {entries?.map((entry) => {
          const book = entry.books;
          const sessions = entry.reading_sessions ?? [];
          const lastSession = [...sessions].sort(
            (a, b) => b.sequence_number - a.sequence_number,
          )[0];
          const tone = statusTone(entry.reading_statuses?.key ?? "");
          return (
            <li key={entry.id}>
              <Link
                href={`/library/${entry.id}`}
                className="flex overflow-hidden rounded-lg border border-dust-line bg-paper-raised transition-colors hover:border-ink-soft"
              >
                <span className="w-1.5 shrink-0" style={{ background: tone.dot }} />
                <div className="flex flex-1 gap-3 p-3">
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded-sm bg-dust-line">
                    {book?.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.thumbnail_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="line-clamp-2 font-serif font-medium leading-snug text-ink">
                      {book?.title}
                    </p>
                    <p className="truncate text-sm text-ink-soft">
                      {book?.authors?.join(", ")}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs">
                      <span
                        className="flex items-center gap-1 font-medium"
                        style={{ color: tone.fg }}
                      >
                        <StatusGlyph
                          statusKey={entry.reading_statuses?.key ?? ""}
                          maskColor="var(--paper-raised)"
                        />
                        {entry.reading_statuses?.label}
                      </span>
                      {lastSession?.format && (
                        <span className="text-ink-soft">
                          {FORMAT_LABEL[lastSession.format]}
                        </span>
                      )}
                      {sessions.length > 1 && (
                        <span className="text-ink-soft">
                          {sessions.length} leituras
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
