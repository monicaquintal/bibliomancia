import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewShelfForm } from "@/components/NewShelfForm";

const SPINE_H = 176;
const SPINE_GAP = 28;
const FACE_H = 208;
const FACE_GAP = 40;

function plankBackground(itemH: number, gap: number) {
  const period = itemH + gap;
  const edge1 = itemH + 3;
  const edge2 = itemH + Math.round(gap * 0.29);
  const edge3 = edge2 + 2;
  return (
    `repeating-linear-gradient(to bottom,` +
    `transparent 0px, transparent ${itemH}px,` +
    `var(--cover) ${itemH}px, var(--cover) ${edge1}px,` +
    `var(--cover-dark) ${edge1}px, var(--cover-dark) ${edge2}px,` +
    `var(--night) ${edge2}px, var(--night) ${edge3}px,` +
    `transparent ${edge3}px, transparent ${period}px)`
  );
}

function hashHue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

type ShelfBook = {
  entryId: string;
  bookId: string;
  title: string;
  authors: string[];
  thumbnailUrl: string | null;
  pageCount: number | null;
  finishedAt: string | null;
};

function Spine({ book }: { book: ShelfBook }) {
  const width = book.pageCount
    ? Math.max(24, Math.min(44, Math.round(book.pageCount / 14)))
    : 30;
  const fallbackHue = hashHue(book.bookId);

  return (
    <li className="group relative z-0 hover:z-20 focus-within:z-20">
      <Link
        href={`/library/${book.entryId}`}
        aria-label={`${book.title} — ${book.authors.join(", ")}`}
        className="block shrink-0 rounded-[2px] shadow-[1px_0_0_rgba(0,0,0,0.15)_inset,-1px_0_0_rgba(255,255,255,0.12)_inset] outline-offset-2"
        style={{
          width,
          height: SPINE_H,
          backgroundImage: book.thumbnailUrl ? `url(${book.thumbnailUrl})` : undefined,
          backgroundColor: book.thumbnailUrl
            ? undefined
            : `hsl(${fallbackHue} 28% 38%)`,
          backgroundSize: "auto 100%",
          backgroundPosition: "center",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 z-10 w-40 -translate-x-1/2 -translate-y-[calc(100%+10px)] scale-95 opacity-0 transition-[opacity,transform] duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100">
        <div className="rounded-lg border border-dust-line bg-paper-raised p-2.5 text-xs shadow-lg">
          <p className="line-clamp-2 font-serif font-medium text-ink">{book.title}</p>
          {book.authors.length > 0 && (
            <p className="mt-0.5 text-ink-soft">{book.authors.join(", ")}</p>
          )}
        </div>
      </div>
    </li>
  );
}

function FaceOutCover({ book, index }: { book: ShelfBook; index: number }) {
  const fallbackHue = hashHue(book.bookId);
  const tilt = index % 2 === 0 ? "-rotate-1" : "rotate-1";

  return (
    <li className="group relative z-0 hover:z-20 focus-within:z-20">
      <Link
        href={`/library/${book.entryId}`}
        aria-label={`${book.title} — ${book.authors.join(", ")}`}
        className={`block w-36 shrink-0 overflow-hidden rounded-sm shadow-[0_10px_16px_-8px_rgba(46,39,32,0.45)] transition-transform hover:-translate-y-1 hover:rotate-0 ${tilt}`}
        style={{ height: FACE_H }}
      >
        {book.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.thumbnailUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center p-3 text-center"
            style={{ background: `hsl(${fallbackHue} 30% 40%)` }}
          >
            <span className="font-serif text-sm font-medium text-paper">{book.title}</span>
          </div>
        )}
      </Link>
      <div className="pointer-events-none absolute left-1/2 top-0 z-10 w-44 -translate-x-1/2 -translate-y-[calc(100%+10px)] scale-95 opacity-0 transition-[opacity,transform] duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100">
        <div className="rounded-lg border border-dust-line bg-paper-raised p-2.5 text-xs shadow-lg">
          <p className="line-clamp-2 font-serif font-medium text-ink">{book.title}</p>
          {book.authors.length > 0 && (
            <p className="mt-0.5 text-ink-soft">{book.authors.join(", ")}</p>
          )}
        </div>
      </div>
    </li>
  );
}

const BOOKS_PER_SHELF = 12;
// Largura reservada por livro; cada estante tem sempre o tamanho de 12 lombadas,
// então uma prateleira incompleta continua parecendo uma prateleira.
const SPINE_SLOT = 38;

// Cada estante comporta 12 lombadas; passou disso, abre outra. Em telas largas
// as estantes ficam lado a lado, e quebram para a linha de baixo quando faltar espaço.
function SpineShelf({ books }: { books: ShelfBook[] }) {
  const shelves: ShelfBook[][] = [];
  for (let i = 0; i < books.length; i += BOOKS_PER_SHELF) {
    shelves.push(books.slice(i, i + BOOKS_PER_SHELF));
  }
  return (
    <div className="flex flex-wrap gap-4">
      {shelves.map((shelf, i) => (
        <div
          key={i}
          className="max-w-full rounded-lg border border-dust-line bg-paper-raised p-6"
          style={{
            contentVisibility: "auto",
            containIntrinsicSize: `auto ${SPINE_H + SPINE_GAP + 48}px`,
          }}
        >
          <ul
            className="flex items-end gap-x-px"
            style={{
              width: BOOKS_PER_SHELF * SPINE_SLOT,
              maxWidth: "100%",
              paddingBottom: SPINE_GAP,
              backgroundImage: plankBackground(SPINE_H, SPINE_GAP),
            }}
          >
            {shelf.map((book) => (
              <Spine key={book.entryId} book={book} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const UNDATED = "sem-data";

export default async function VitrinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: entries }, { data: shelves }] = await Promise.all([
    supabase
      .from("library_entries")
      .select(
        "id, updated_at, books(id, title, authors, thumbnail_url, page_count), reading_statuses(key), reading_sessions(status, finished_at), shelf_entries(shelf_id)",
      )
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("shelves")
      .select("id, name")
      .eq("user_id", user!.id)
      .order("name", { ascending: true }),
  ]);

  const toShelfBook = (e: NonNullable<typeof entries>[number]): ShelfBook | null => {
    if (!e.books) return null;
    const concluded = (e.reading_sessions ?? [])
      .filter((s) => s.status === "concluida" && s.finished_at)
      .sort((a, b) => (b.finished_at as string).localeCompare(a.finished_at as string));
    return {
      entryId: e.id,
      bookId: e.books.id,
      title: e.books.title,
      authors: e.books.authors ?? [],
      thumbnailUrl: e.books.thumbnail_url,
      pageCount: e.books.page_count,
      finishedAt: concluded[0]?.finished_at ?? null,
    };
  };

  const reading = (entries ?? [])
    .filter((e) => e.reading_statuses?.key === "lendo")
    .map(toShelfBook)
    .filter((b): b is ShelfBook => b !== null);

  const read = (entries ?? [])
    .filter((e) => e.reading_statuses?.key === "lido")
    .map(toShelfBook)
    .filter((b): b is ShelfBook => b !== null)
    .sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""));

  const customShelves = (shelves ?? []).map((shelf) => ({
    ...shelf,
    books: (entries ?? [])
      .filter((e) => e.shelf_entries?.some((se) => se.shelf_id === shelf.id))
      .map(toShelfBook)
      .filter((b): b is ShelfBook => b !== null),
  }));

  const byYear = new Map<string, ShelfBook[]>();
  for (const book of read) {
    const year = book.finishedAt ? book.finishedAt.slice(0, 4) : UNDATED;
    const group = byYear.get(year);
    if (group) group.push(book);
    else byYear.set(year, [book]);
  }

  // Estante com nome de ano ("2023") se junta ao bloco desse ano em "Já lido",
  // em vez de aparecer duas vezes na Vitrine.
  const isYearShelf = (name: string) => /^\d{4}$/.test(name.trim());
  for (const shelf of customShelves.filter((s) => isYearShelf(s.name))) {
    const year = shelf.name.trim();
    const group = byYear.get(year) ?? [];
    const seen = new Set(group.map((b) => b.entryId));
    const undated = byYear.get(UNDATED);
    for (const book of shelf.books) {
      if (seen.has(book.entryId)) continue;
      // livro sem data de término sai de "Sem data" e vai para o ano da estante
      const i = undated?.findIndex((u) => u.entryId === book.entryId) ?? -1;
      if (i >= 0) undated!.splice(i, 1);
      group.push(book);
    }
    group.sort((a, b) => (b.finishedAt ?? "").localeCompare(a.finishedAt ?? ""));
    byYear.set(year, group);
  }
  if (byYear.get(UNDATED)?.length === 0) byYear.delete(UNDATED);
  const otherShelves = customShelves.filter((s) => !isYearShelf(s.name));
  const shownCount = new Set([...byYear.values()].flat().map((b) => b.entryId)).size;

  const years = [...byYear.keys()].sort((a, b) => {
    if (a === UNDATED) return 1;
    if (b === UNDATED) return -1;
    return b.localeCompare(a);
  });

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Vitrine</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Um retrato da sua estante: o que você está lendo agora, de capa pra fora, e
          tudo que você já leu, lombada a lombada, organizado por ano. Passe o mouse
          sobre uma lombada para ver o título.
        </p>
        <div className="mt-4">
          <NewShelfForm />
        </div>
      </div>

      {reading.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-semibold text-ink">Lendo agora</h2>
          <div className="rounded-lg border border-dust-line bg-paper-raised p-6">
            <ul
              className="flex flex-wrap items-end gap-x-5"
              style={{
                rowGap: FACE_GAP,
                paddingBottom: FACE_GAP,
                backgroundImage: plankBackground(FACE_H, FACE_GAP),
              }}
            >
              {reading.map((book, i) => (
                <FaceOutCover key={book.entryId} book={book} index={i} />
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold text-ink">Já lido</h2>
          {shownCount > 0 && (
            <p className="text-sm text-ink-soft">
              {shownCount} {shownCount === 1 ? "livro" : "livros"}
            </p>
          )}
        </div>

        {shownCount === 0 ? (
          <p className="text-sm text-ink-soft">
            Ainda não há livros aqui — quando você terminar uma leitura, ele ganha um
            lugar nesta estante.
          </p>
        ) : (
          <>
            {years.length > 1 && (
              <nav className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {years.map((year) => (
                  <a
                    key={year}
                    href={`#ano-${year}`}
                    className="text-cover underline decoration-cover/40 underline-offset-2 hover:text-cover-dark"
                  >
                    {year === UNDATED ? "Sem data" : year}
                  </a>
                ))}
              </nav>
            )}
            <div className="space-y-8">
              {years.map((year) => {
                const books = byYear.get(year)!;
                return (
                  <div key={year} className="space-y-2">
                    <h3
                      id={`ano-${year}`}
                      className="scroll-mt-20 font-serif text-base font-semibold text-ink"
                    >
                      {year === UNDATED ? "Sem data" : year}
                      <span className="ml-2 text-sm font-normal text-ink-soft">
                        {books.length} {books.length === 1 ? "livro" : "livros"}
                      </span>
                    </h3>
                    <SpineShelf books={books} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-lg font-semibold text-ink">Minhas estantes</h2>
        {otherShelves.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Crie estantes para agrupar livros do seu jeito — “Favoritos”, “Clube do livro”,
            “Emprestados”. Um livro pode estar em várias ao mesmo tempo.
          </p>
        ) : (
          <div className="space-y-8">
            {otherShelves.map((shelf) => (
              <div key={shelf.id} className="space-y-2">
                <h3 className="font-serif text-base font-semibold text-ink">
                  {shelf.name}
                  <span className="ml-2 text-sm font-normal text-ink-soft">
                    {shelf.books.length} {shelf.books.length === 1 ? "livro" : "livros"}
                  </span>
                </h3>
                {shelf.books.length === 0 ? (
                  <p className="text-sm text-ink-soft">
                    Vazia por enquanto — abra um livro da sua estante e escolha esta estante
                    na seção “Estantes”.
                  </p>
                ) : (
                  <SpineShelf books={shelf.books} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
