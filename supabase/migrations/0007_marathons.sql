-- Maratonas pessoais: desafios de leitura que você cria para si mesmo.
-- Duas formas de uso:
--   * com lista de livros (ex: uma série inteira): o progresso é quantos da lista você leu;
--   * sem lista, com período e meta (ex: 3 livros em maio): conta os livros terminados no período.
create table marathons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text check (char_length(description) <= 1000),
  starts_on date,
  ends_on date,
  target_books int check (target_books > 0),
  created_at timestamptz not null default now(),
  check (starts_on is null or ends_on is null or ends_on >= starts_on)
);
create index marathons_user_idx on marathons (user_id);

create table marathon_entries (
  marathon_id uuid not null references marathons(id) on delete cascade,
  library_entry_id uuid not null references library_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (marathon_id, library_entry_id)
);
create index marathon_entries_entry_idx on marathon_entries (library_entry_id);
create index marathon_entries_user_idx on marathon_entries (user_id);

alter table marathons enable row level security;
alter table marathon_entries enable row level security;

create policy marathons_all on marathons
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy marathon_entries_all on marathon_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
