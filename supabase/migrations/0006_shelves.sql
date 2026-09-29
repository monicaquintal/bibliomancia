-- Estantes personalizadas do usuário. Diferente do status (um só por livro),
-- um livro pode estar em várias estantes ao mesmo tempo.
create table shelves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);
create unique index shelves_user_name_idx on shelves (user_id, lower(name));

create table shelf_entries (
  shelf_id uuid not null references shelves(id) on delete cascade,
  library_entry_id uuid not null references library_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (shelf_id, library_entry_id)
);
create index shelf_entries_entry_idx on shelf_entries (library_entry_id);
create index shelf_entries_user_idx on shelf_entries (user_id);

alter table shelves enable row level security;
alter table shelf_entries enable row level security;

create policy shelves_all on shelves
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy shelf_entries_all on shelf_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
