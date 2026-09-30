-- Desafios com tema dentro de uma maratona (ex: "livro com a letra A", "capa azul").
-- Cada desafio pode ser preenchido com um livro da estante do usuário.
create table marathon_challenges (
  id uuid primary key default gen_random_uuid(),
  marathon_id uuid not null references marathons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  position int not null default 0,
  library_entry_id uuid references library_entries(id) on delete set null,
  created_at timestamptz not null default now()
);
create index marathon_challenges_marathon_idx on marathon_challenges (marathon_id, position);
create index marathon_challenges_entry_idx on marathon_challenges (library_entry_id);
create index marathon_challenges_user_idx on marathon_challenges (user_id);

alter table marathon_challenges enable row level security;

create policy marathon_challenges_all on marathon_challenges
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
