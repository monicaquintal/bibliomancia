import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusSelect } from "@/components/StatusSelect";
import { StarRating } from "@/components/StarRating";
import { ReviewEditor } from "@/components/ReviewEditor";
import { CommentForm } from "@/components/CommentForm";
import { ConfirmButton } from "@/components/ConfirmButton";
import { StatusGlyph } from "@/components/StatusGlyph";
import {
  abandonSession,
  finishSession,
  startReadingSession,
  updateSessionDates,
} from "@/actions/reading";
import { deleteLibraryEntry } from "@/actions/books";

const SESSION_STATUS_LABEL: Record<string, string> = {
  em_andamento: "Em andamento",
  concluida: "Concluída",
  abandonada: "Abandonada",
};

const FORMAT_LABEL: Record<string, string> = {
  livro: "Livro físico",
  ebook: "Ebook",
  audiobook: "Audiobook",
};

function FormatIcon({ format }: { format: string | null }) {
  if (format === "audiobook") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 11v-1a6 6 0 0 1 12 0v1" strokeLinecap="round" />
        <rect x="2.5" y="11" width="3.5" height="5" rx="1.2" />
        <rect x="14" y="11" width="3.5" height="5" rx="1.2" />
      </svg>
    );
  }
  if (format === "ebook") {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4" y="2.5" width="12" height="15" rx="1.5" />
        <path d="M7 6h6M7 9h6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 4.8c-1.4-1-3.3-1.6-5.4-1.6-.9 0-1.6.1-2.1.3v9.7c.5-.2 1.2-.3 2.1-.3 2.1 0 4 .6 5.4 1.6 1.4-1 3.3-1.6 5.4-1.6.9 0 1.6.1 2.1.3V3.5c-.5-.2-1.2-.3-2.1-.3-2.1 0-4 .6-5.4 1.6z" />
      <path d="M10 4.8v9.7" />
    </svg>
  );
}

export default async function LibraryEntryPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: entry }, { data: statuses }, { data: sessions }] = await Promise.all([
    supabase
      .from("library_entries")
      .select("id, status_id, books(*), reading_statuses(id, key, label)")
      .eq("id", entryId)
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("reading_statuses")
      .select("id, label")
      .or(`user_id.is.null,user_id.eq.${user!.id}`)
      .order("sort_order", { ascending: true }),
    supabase
      .from("reading_sessions")
      .select("*")
      .eq("library_entry_id", entryId)
      .order("sequence_number", { ascending: false }),
  ]);

  if (!entry || !entry.books) notFound();

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: comments } =
    sessionIds.length > 0
      ? await supabase
          .from("reading_comments")
          .select("*")
          .in("reading_session_id", sessionIds)
          .order("created_at", { ascending: true })
      : { data: [] };

  const book = entry.books;
  const hasActiveSession = (sessions ?? []).some((s) => s.status === "em_andamento");

  return (
    <div className="grid gap-10 md:grid-cols-[300px_1px_1fr]">
      <div className="space-y-5">
        <div className="h-56 w-40 overflow-hidden rounded-sm bg-dust-line shadow-[3px_4px_0_var(--dust-line)]">
          {book.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold leading-snug text-ink">
            {book.title}
          </h1>
          {book.subtitle && <p className="mt-0.5 text-ink-soft">{book.subtitle}</p>}
          <p className="mt-1 text-ink-soft">{book.authors?.join(", ")}</p>
          <p className="mt-1 text-sm text-ink-soft/80">
            {[book.publisher, book.published_year, book.isbn_13 ?? book.isbn_10]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusGlyph
            statusKey={entry.reading_statuses?.key ?? ""}
            maskColor="var(--paper)"
            className="h-4 w-4"
          />
          <StatusSelect entryId={entry.id} statusId={entry.status_id} statuses={statuses ?? []} />
        </div>

        {!hasActiveSession && (
          <form action={startReadingSession} className="space-y-2 rounded-lg border border-dust-line bg-paper-raised p-3">
            <label htmlFor="format" className="block text-xs font-medium text-ink-soft">
              {sessions && sessions.length > 0 ? "Reler em que formato?" : "Em que formato?"}
            </label>
            <input type="hidden" name="entryId" value={entry.id} />
            <div className="flex flex-wrap items-center gap-2">
              <select
                id="format"
                name="format"
                required
                defaultValue="livro"
                className="rounded-lg border border-dust-line px-2 py-1.5 text-sm focus:border-cover focus:outline-none"
              >
                <option value="livro">Livro físico</option>
                <option value="ebook">Ebook</option>
                <option value="audiobook">Audiobook</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-cover px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark"
              >
                {sessions && sessions.length > 0 ? "Nova leitura" : "Iniciar leitura"}
              </button>
            </div>
          </form>
        )}

        <form action={deleteLibraryEntry} className="border-t border-dust-line pt-4">
          <input type="hidden" name="entryId" value={entry.id} />
          <ConfirmButton
            confirmMessage={`Excluir "${book.title}" da sua estante? Isso apaga todo o histórico de leituras, comentários e avaliações desse livro. Essa ação não pode ser desfeita.`}
            className="text-sm text-ink-soft transition-colors hover:text-berry"
          >
            Excluir da estante
          </ConfirmButton>
        </form>
      </div>

      <div className="hidden bg-dust-line md:block" />

      <div className="space-y-6">
        <h2 className="font-serif text-xl font-semibold text-ink">Registro de leituras</h2>
        {(!sessions || sessions.length === 0) && (
          <p className="text-sm text-ink-soft">Nenhuma leitura registrada ainda.</p>
        )}
        <ul className="space-y-8 border-l border-dust-line pl-6">
          {sessions?.map((session) => {
            const sessionComments = (comments ?? []).filter(
              (c) => c.reading_session_id === session.id,
            );
            return (
              <li key={session.id} className="relative space-y-4">
                <span
                  aria-hidden="true"
                  className="absolute -left-[29px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-paper-raised text-ink-soft ring-2 ring-dust-line"
                >
                  <FormatIcon format={session.format} />
                </span>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-medium text-ink">
                    Leitura #{session.sequence_number}
                    {session.format && (
                      <span className="text-sm font-normal text-ink-soft">
                        · {FORMAT_LABEL[session.format]}
                      </span>
                    )}
                  </h3>
                  <span className="text-xs font-medium text-ink-soft">
                    {SESSION_STATUS_LABEL[session.status]}
                  </span>
                </div>

                <form
                  action={updateSessionDates}
                  className="flex flex-wrap items-end gap-3 text-sm"
                >
                  <input type="hidden" name="sessionId" value={session.id} />
                  <label>
                    <span className="block text-xs text-ink-soft">Início</span>
                    <input
                      type="date"
                      name="startedAt"
                      defaultValue={session.started_at ?? ""}
                      className="mt-1 rounded-lg border border-dust-line px-2 py-1 text-sm focus:border-cover focus:outline-none"
                    />
                  </label>
                  <label>
                    <span className="block text-xs text-ink-soft">Término</span>
                    <input
                      type="date"
                      name="finishedAt"
                      defaultValue={session.finished_at ?? ""}
                      className="mt-1 rounded-lg border border-dust-line px-2 py-1 text-sm focus:border-cover focus:outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-lg border border-dust-line px-3 py-1 text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
                  >
                    Salvar
                  </button>
                </form>

                {session.status === "em_andamento" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={finishSession} className="flex items-end gap-2">
                      <input type="hidden" name="sessionId" value={session.id} />
                      <label className="text-sm">
                        <span className="block text-xs text-ink-soft">Data de término</span>
                        <input
                          type="date"
                          name="finishedAt"
                          required
                          defaultValue={new Date().toISOString().slice(0, 10)}
                          className="mt-1 rounded-lg border border-dust-line px-2 py-1 text-sm focus:border-cover focus:outline-none"
                        />
                      </label>
                      <button
                        type="submit"
                        className="rounded-lg bg-cover px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:bg-cover-dark"
                      >
                        Concluir leitura
                      </button>
                    </form>
                    <form action={abandonSession}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <ConfirmButton
                        confirmMessage="Tem certeza que quer abandonar essa leitura?"
                        className="rounded-lg border border-dust-line px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-berry hover:text-berry"
                      >
                        Abandonar leitura
                      </ConfirmButton>
                    </form>
                  </div>
                )}

                {session.status === "concluida" && (
                  <div className="space-y-3 border-t border-dust-line pt-3">
                    <StarRating sessionId={session.id} ratingHalf={session.rating_half} />
                    <ReviewEditor
                      key={session.review ?? "no-review"}
                      sessionId={session.id}
                      review={session.review}
                    />
                  </div>
                )}

                <div className="space-y-3 border-t border-dust-line pt-3">
                  <h4 className="text-sm font-medium text-ink-soft">Comentários</h4>
                  {sessionComments.length === 0 && (
                    <p className="text-sm text-ink-soft/80">Nenhum comentário ainda.</p>
                  )}
                  <ul className="space-y-2">
                    {sessionComments.map((comment) => (
                      <li
                        key={comment.id}
                        className="rounded-lg bg-paper-raised p-2.5 text-sm text-ink"
                      >
                        <p>{comment.body}</p>
                        <p className="mt-1 text-xs text-ink-soft">
                          {new Date(comment.created_at).toLocaleDateString("pt-BR")}
                          {comment.progress_page ? ` · página ${comment.progress_page}` : ""}
                          {comment.progress_percent !== null
                            ? ` · ${comment.progress_percent}% concluído`
                            : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                  {session.status === "em_andamento" && (
                    <CommentForm sessionId={session.id} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
