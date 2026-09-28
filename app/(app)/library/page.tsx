import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewCustomStatusForm } from "@/components/NewCustomStatusForm";
import { StatusGlyph } from "@/components/StatusGlyph";
import { LibrarySearch, type LibraryEntryView } from "@/components/LibrarySearch";
import { statusTone } from "@/lib/status-colors";

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

  const entryViews: LibraryEntryView[] = (entries ?? []).map((entry) => {
    const sessions = entry.reading_sessions ?? [];
    const lastSession = [...sessions].sort((a, b) => b.sequence_number - a.sequence_number)[0];
    return {
      id: entry.id,
      title: entry.books?.title ?? "",
      authors: entry.books?.authors ?? [],
      thumbnailUrl: entry.books?.thumbnail_url ?? null,
      statusKey: entry.reading_statuses?.key ?? "",
      statusLabel: entry.reading_statuses?.label ?? "",
      lastFormat: lastSession?.format ?? null,
      sessionCount: sessions.length,
    };
  });

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

      {entries && entries.length > 0 && <LibrarySearch entries={entryViews} />}
    </div>
  );
}
