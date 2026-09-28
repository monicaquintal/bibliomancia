-- Meta de leitura anual: quantos livros o usuário pretende ler em um ano
create table reading_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  target_books int not null check (target_books > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year)
);
create index reading_goals_user_idx on reading_goals (user_id);

alter table reading_goals enable row level security;

create policy reading_goals_all on reading_goals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
