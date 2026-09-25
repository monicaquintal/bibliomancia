import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
    `#a9825c ${itemH}px, #a9825c ${edge1}px,` +
    `#8a6a4a ${edge1}px, #8a6a4a ${edge2}px,` +
    `#5c4530 ${edge2}px, #5c4530 ${edge3}px,` +
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
    ? Math.max(11, Math.min(26, Math.round(book.pageCount / 24)))
    : 14;
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

function SpineShelf({ books }: { books: ShelfBook[] }) {
  const estimatedRows = Math.max(1, Math.ceil((books.length * 15) / 900));
  return (
    <div
      className="rounded-lg bg-[#eee0c8] p-6"
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: `auto ${estimatedRows * (SPINE_H + SPINE_GAP) + 48}px`,
      }}
    >
      <ul
        className="flex flex-wrap items-end gap-x-px"
        style={{
          rowGap: SPINE_GAP,
          paddingBottom: SPINE_GAP,
          backgroundImage: plankBackground(SPINE_H, SPINE_GAP),
        }}
      >
        {books.map((book) => (
          <Spine key={book.entryId} book={book} />
        ))}
      </ul>
    </div>
  );
}

const UNDATED = "sem-data";

export default async function VitrinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("library_entries")
    .select(
      "id, updated_at, books(id, title, authors, thumbnail_url, page_count), reading_statuses(key), reading_sessions(status, finished_at)",
    )
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

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

  const byYear = new Map<string, ShelfBook[]>();
  for (const book of read) {
    const year = book.finishedAt ? book.finishedAt.slice(0, 4) : UNDATED;
    const group = byYear.get(year);
    if (group) group.push(book);
    else byYear.set(year, [book]);
  }
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
      </div>

      {reading.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-semibold text-ink">Lendo agora</h2>
          <div className="rounded-lg bg-[#eee0c8] p-6">
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
          {read.length > 0 && (
            <p className="text-sm text-ink-soft">
              {read.length} {read.length === 1 ? "livro" : "livros"}
            </p>
          )}
        </div>

        {read.length === 0 ? (
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
    </div>
  );
}
