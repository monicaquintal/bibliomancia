# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Purpose

Bibliomancia is a personal reading tracker: search books/editions via the Google Books API, add them to a personal shelf with a status (quero/tenho/lendo/lido/abandonado, plus user-defined custom statuses), and log reading activity — start/finish/abandon a reading session per format (livro físico/ebook/audiobook), dated progress comments while in progress, and, once a session is concluded, a half-star rating (1–5) and a review. Rereads are modeled as multiple `reading_sessions` per book, so history isn't overwritten. It's multi-user (Supabase Auth + RLS, one shelf per user) but the shared `books` table caches the Google Books catalog across everyone. `app/(app)/vitrine/page.tsx` is a purely visual second view of the same data: currently-reading books shown cover-out, and everything finished shown as spines on a shelf grouped by the year it was finished.

## Stack

Next.js 16 (App Router, Turbopack) + React 19 + TypeScript, styled with Tailwind CSS v4 via CSS custom-property theme tokens (no UI component library). Supabase (Postgres + Auth) is the entire backend, accessed through `@supabase/ssr`/`@supabase/supabase-js` — no separate API server. Zod validates all Server Action input. The Google Books API (`lib/google-books.ts`) is the only third-party data source. Deployment target is Vercel (app) + Supabase (DB/auth), both on free tiers — see `README.md` for the setup walkthrough.

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (`eslint.config.mjs`)
- Type check: no npm script for it — run `npx tsc --noEmit` directly
- No test framework is configured in this repo (no test script, no test files)
- DB migrations live in `supabase/migrations/*.sql`, applied in filename order. Apply via the Supabase Studio SQL Editor, or `npx supabase link --project-ref <ref>` then `npx supabase db push` (the CLI's project-management commands go over HTTPS, but `db push`/`migration list --linked` open a direct Postgres connection on port 5432/6543, which some sandboxed/restricted network environments block even though the HTTPS calls succeed)

## Environment

Copy `.env.example` → `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — required.
- `GOOGLE_BOOKS_API_KEY` — optional; without it, search still works but quickly hits a low, shared, unauthenticated rate limit.

## Architecture

Next.js 16 App Router + Turbopack, React 19, TypeScript, Tailwind v4. Supabase (Postgres + Auth) is the entire backend — there is no separate API server.

One concrete consequence of the breaking changes noted in `@AGENTS.md`: the session-refresh middleware convention in this version lives in `proxy.ts` at the repo root (not `middleware.ts`).

- **Supabase clients**: `lib/supabase/server.ts` (Server Components/Actions, cookie-based) and `lib/supabase/client.ts` (Client Components). `proxy.ts` → `lib/supabase/proxy.ts` refreshes the session cookie on every request (matcher excludes static assets). It only checks that a session cookie exists, not that it's still valid — a Server Component under `app/(app)/` can still get `user === null` from `supabase.auth.getUser()` (e.g. the account was deleted) and must handle that itself rather than assuming the proxy already guaranteed a user.
- **Route groups**: `app/(auth)/` (login/signup) and `app/(app)/` (estante/vitrine/search, session-gated). `app/auth/callback/route.ts` exchanges the Supabase email/OAuth redirect code for a session.
- **Server Actions** in `actions/` (`auth.ts`, `books.ts`, `reading.ts`) are the only write path — no client-side Supabase mutations. Every action parses its input with a Zod schema from `lib/validation.ts` before touching Supabase. Several of these schemas mirror a Postgres CHECK constraint from the migrations (e.g. `rating_half` is 2–10 in both `0001_init_schema.sql` and `setRatingSchema`) — keep both sides in sync when changing either.
- **`lib/database.types.ts` is hand-written**, not generated (no `supabase gen types` step in this repo). Update it manually whenever a migration changes a table shape.

### Data model (`supabase/migrations/`)

- `books` — shared cache of the Google Books catalog; any authenticated user can insert/read it (not per-user RLS).
- `reading_statuses` — shelf statuses. System rows (`user_id is null`): quero, tenho, lendo, lido, abandonado. Users can add their own custom ones (`is_system = false`).
- `library_entries` — one row per (user, book); `status_id` is the book's current shelf status.
- `reading_sessions` — one row per reading cycle of a `library_entries` row (rereads = additional rows with increasing `sequence_number`). Holds `status` (em_andamento/concluida/abandonada), `format` (livro/ebook/audiobook), dates, and — only once concluded — `rating_half` (1–5 stars in 0.5 steps, stored as integers 2–10) and `review`; a DB CHECK enforces that rating/review can only be non-null when the session is concluded.
- `reading_comments` — dated progress notes tied to one `reading_session`.
- `shelves` / `shelf_entries` — user-defined shelves (many-to-many with `library_entries`, unlike the single `status_id`). Shelves named as a 4-digit year are merged into that year's block in the vitrine.
- `marathons` / `marathon_entries` / `marathon_challenges` — personal reading challenges. Progress (`lib/marathons.ts`): with challenges, each challenge is one "book" (done when its assigned entry is read); else with a book list, listed books that are read; else, with no list, concluded sessions finished inside the period vs `target_books`.
- `challenges` — independent challenge library (`user_id` null = app catalog, else the user's own). `catalog_marathons` + `catalog_marathon_challenges` are the app-maintained catalog; "Participar" (`joinCatalogMarathon`) copies one into a user marathon. `marathon_challenges.title` is a snapshot, `challenge_id` only records the origin.
- `books.google_volume_id` is a generic external id: plain Google volume ids, `ol:<work>` for Open Library, `manual:<id>` for hand-entered books.
- Status transitions are cross-cutting and all live in `actions/reading.ts`: starting a session sets the entry to "lendo", finishing sets it to "lido", abandoning sets it to "abandonado". They look up the system status id by key via `getSystemStatusId()` rather than hardcoding UUIDs — do the same for any new status-changing action.

### Design system (`app/globals.css`)

- All color comes from theme tokens, not raw Tailwind grays: `paper`/`paper-raised`/`ink`/`ink-soft`/`cover`/`marigold`/`berry`/`sky`/`dust`/`dust-line`, each with a light value and a `prefers-color-scheme: dark` override. Fonts are Fraunces (serif, headings/titles) + Karla (sans, UI), loaded in `app/layout.tsx` via `next/font/google`.
- `lib/status-colors.ts` maps a `reading_statuses.key` to a color tone (`fg`/`bg`/`dot`) and is the single source of truth for status color everywhere it appears (estante filters, spine-edge cards, badges). Add new system statuses there too, or they fall back to a neutral tone.
- `app/(app)/vitrine/page.tsx` draws bookshelves in CSS: each spine shelf is a fixed-height flex row holding at most 12 books (`BOOKS_PER_SHELF`; more books open another shelf row below), and a `repeating-linear-gradient` background timed to exactly `itemHeight + rowGap` fakes the wooden plank under it. If you change `SPINE_H`/`SPINE_GAP`/`FACE_H`/`FACE_GAP`, the container needs `paddingBottom` equal to the row gap or the plank gets clipped by the box's own height — and anything rendered below a fixed-height cover (e.g. a permanent caption) breaks the period math, which is why book titles there are a hover tooltip instead of inline text.
