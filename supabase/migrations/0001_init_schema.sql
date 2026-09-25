-- Cache local do catálogo Google Books (compartilhado entre todos os usuários)
create table books (
  id uuid primary key default gen_random_uuid(),
  google_volume_id text not null unique,
  isbn_10 text,
  isbn_13 text,
  title text not null,
  subtitle text,
  authors text[] not null default '{}',
  publisher text,
  published_date text,
  published_year int,
  description text,
  page_count int,
  language text,
  thumbnail_url text,
  raw_json jsonb,
  created_at timestamptz not null default now()
);
create index books_isbn13_idx on books (isbn_13) where isbn_13 is not null;
create index books_isbn10_idx on books (isbn_10) where isbn_10 is not null;

-- Status de biblioteca: linhas de sistema (user_id null) + customizados por usuário
create table reading_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  key text not null,
  label text not null,
  is_system boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create unique index reading_statuses_system_key_idx
  on reading_statuses (key) where user_id is null;
create unique index reading_statuses_user_key_idx
  on reading_statuses (user_id, key) where user_id is not null;

-- Item da biblioteca do usuário (um por par usuário+livro)
create table library_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references books(id) on delete restrict,
  status_id uuid not null references reading_statuses(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);
create index library_entries_user_idx on library_entries (user_id);
create index library_entries_status_idx on library_entries (status_id);

-- Ciclos de leitura (cada linha é uma leitura; múltiplas linhas = releitura)
create table reading_sessions (
  id uuid primary key default gen_random_uuid(),
  library_entry_id uuid not null references library_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence_number int not null,
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'concluida', 'abandonada')),
  started_at date,
  finished_at date,
  rating_half smallint check (rating_half between 2 and 10),
  rating numeric(2, 1) generated always as (rating_half / 2.0) stored,
  review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (library_entry_id, sequence_number),
  check (
    (rating_half is null and review is null) or status = 'concluida'
  )
);
create index reading_sessions_entry_idx on reading_sessions (library_entry_id);
create index reading_sessions_user_idx on reading_sessions (user_id);

-- Comentários datados (diário de leitura), vinculados a uma sessão
create table reading_comments (
  id uuid primary key default gen_random_uuid(),
  reading_session_id uuid not null references reading_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  progress_page int,
  progress_percent int check (progress_percent between 0 and 100),
  created_at timestamptz not null default now()
);
create index reading_comments_session_idx on reading_comments (reading_session_id, created_at);
