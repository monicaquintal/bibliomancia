// Parser do CSV exportado pelo Goodreads (My Books → Import and export → Export Library).

export type GoodreadsShelf = "read" | "currently-reading" | "to-read";

export interface GoodreadsRow {
  goodreadsId: string;
  title: string;
  author: string;
  isbn10: string | null;
  isbn13: string | null;
  exclusiveShelf: GoodreadsShelf;
  customShelves: string[];
  rating: number;
  dateRead: string | null;
  review: string;
  binding: string;
  publisher: string | null;
  pageCount: number | null;
  year: number | null;
}

const KNOWN_SHELVES: GoodreadsShelf[] = ["read", "currently-reading", "to-read"];

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((cell) => cell !== "")) rows.push(row);
  return rows;
}

// O Goodreads exporta ISBN como ="0123456789" para o Excel não cortar zeros à esquerda.
function cleanIsbn(raw: string): string | null {
  const digits = raw.replace(/[^0-9Xx]/g, "");
  return digits.length === 10 || digits.length === 13 ? digits : null;
}

function cleanDate(raw: string): string | null {
  const match = raw.trim().match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function cleanReview(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function parseGoodreadsCsv(text: string): GoodreadsRow[] {
  const [header, ...records] = parseCsv(text);
  if (!header) throw new Error("Arquivo vazio");

  const col = (name: string) => header.indexOf(name);
  const idx = {
    bookId: col("Book Id"),
    publisher: col("Publisher"),
    pages: col("Number of Pages"),
    yearPublished: col("Year Published"),
    yearOriginal: col("Original Publication Year"),
    title: col("Title"),
    author: col("Author"),
    isbn: col("ISBN"),
    isbn13: col("ISBN13"),
    rating: col("My Rating"),
    dateRead: col("Date Read"),
    shelves: col("Bookshelves"),
    exclusive: col("Exclusive Shelf"),
    review: col("My Review"),
    binding: col("Binding"),
  };
  if (idx.title < 0 || idx.exclusive < 0) {
    throw new Error("Não parece ser um CSV exportado do Goodreads");
  }

  const get = (record: string[], i: number) => (i >= 0 ? (record[i] ?? "").trim() : "");

  return records
    .filter((record) => get(record, idx.title))
    .map((record) => {
      const exclusive = get(record, idx.exclusive).toLowerCase();
      const shelves = get(record, idx.shelves)
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const isKnown = (KNOWN_SHELVES as string[]).includes(exclusive);
      // Prateleira exclusiva personalizada: vira prateleira comum e o livro entra como "quero".
      const customShelves = shelves.filter((s) => !(KNOWN_SHELVES as string[]).includes(s));
      if (!isKnown && exclusive && !customShelves.includes(exclusive)) {
        customShelves.push(exclusive);
      }

      return {
        goodreadsId: get(record, idx.bookId),
        title: get(record, idx.title),
        author: get(record, idx.author),
        isbn10: cleanIsbn(get(record, idx.isbn)),
        isbn13: cleanIsbn(get(record, idx.isbn13)),
        exclusiveShelf: isKnown ? (exclusive as GoodreadsShelf) : "to-read",
        customShelves,
        rating: Number.parseInt(get(record, idx.rating), 10) || 0,
        dateRead: cleanDate(get(record, idx.dateRead)),
        review: cleanReview(get(record, idx.review)),
        binding: get(record, idx.binding),
        publisher: get(record, idx.publisher) || null,
        pageCount: Number.parseInt(get(record, idx.pages), 10) || null,
        year:
          Number.parseInt(get(record, idx.yearPublished), 10) ||
          Number.parseInt(get(record, idx.yearOriginal), 10) ||
          null,
      };
    });
}

export function shelfLabel(shelf: string): string {
  const spaced = shelf.replace(/[-_]+/g, " ").trim();
  return (spaced.charAt(0).toUpperCase() + spaced.slice(1)).slice(0, 40);
}

const ABANDONED_SHELVES = ["dnf", "abandonado", "abandonados", "abandoned", "did-not-finish"];

export function isAbandonedShelf(shelf: string): boolean {
  return ABANDONED_SHELVES.includes(shelf);
}

export function formatFromBinding(binding: string): "livro" | "ebook" | "audiobook" {
  const b = binding.toLowerCase();
  if (/kindle|ebook|e-book|nook/.test(b)) return "ebook";
  if (/audio/.test(b)) return "audiobook";
  return "livro";
}
