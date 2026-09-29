import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewCustomStatusForm } from "@/components/NewCustomStatusForm";
import { NewShelfForm } from "@/components/NewShelfForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteShelf } from "@/actions/shelves";
import { StatusGlyph } from "@/components/StatusGlyph";
import { LibrarySearch, type LibraryEntryView } from "@/components/LibrarySearch";
import { statusTone } from "@/lib/status-colors";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; shelf?: string }>;
}) {
  const { status: statusFilter, shelf: shelfFilter } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: statuses }, { data: allEntries }, { data: shelves }] = await Promise.all([
    supabase
      .from("reading_statuses")
      .select("id, key, label, is_system, sort_order")
      .or(`user_id.is.null,user_id.eq.${user!.id}`)
      .order("sort_order", { ascending: true }),
    supabase
      .from("library_entries")
      .select(
        "id, status_id, books(title, authors, thumbnail_url), reading_statuses(key, label), reading_sessions(sequence_number, status, format, started_at, finished_at), shelf_entries(shelf_id)",
      )
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("shelves")
      .select("id, name")
      .eq("user_id", user!.id)
      .order("name", { ascending: true }),
  ]);

  const activeShelf = shelves?.find((s) => s.id === shelfFilter);
  const entries = allEntries?.filter(
    (e) =>
      (!statusFilter || e.reading_statuses?.key === statusFilter) &&
      (!activeShelf || e.shelf_entries?.some((se) => se.shelf_id === activeShelf.id)),
  );

  const filterHref = (status?: string, shelf?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (shelf) params.set("shelf", shelf);
    const qs = params.toString();
    return qs ? `/library?${qs}` : "/library";
  };

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
          href={filterHref(undefined, activeShelf?.id)}
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
              href={filterHref(status.key, activeShelf?.id)}
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

      {shelves && shelves.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-soft">Estantes:</span>
          {shelves.map((shelf) => {
            const active = activeShelf?.id === shelf.id;
            return (
              <Link
                key={shelf.id}
                href={filterHref(statusFilter, active ? undefined : shelf.id)}
                aria-current={active ? "true" : undefined}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-cover bg-cover text-paper"
                    : "border-dust-line text-ink-soft hover:border-ink-soft hover:text-ink"
                }`}
              >
                {shelf.name}
              </Link>
            );
          })}
          {activeShelf && (
            <form action={deleteShelf}>
              <input type="hidden" name="shelfId" value={activeShelf.id} />
              <ConfirmButton
                confirmMessage={`Excluir a estante "${activeShelf.name}"? Os livros continuam na sua biblioteca.`}
                className="text-xs text-ink-soft underline hover:text-berry"
              >
                Excluir estante
              </ConfirmButton>
            </form>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <NewShelfForm />
          <NewCustomStatusForm />
        </div>
        <Link
          href="/library/importar"
          className="text-sm font-medium text-ink-soft underline hover:text-ink"
        >
          Importar do Goodreads
        </Link>
      </div>

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
