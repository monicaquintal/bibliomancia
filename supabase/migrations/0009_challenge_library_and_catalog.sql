-- Biblioteca de desafios (independentes de qualquer maratona) e catálogo de maratonas prontas.
--   * challenges com user_id nulo = desafios do catálogo, visíveis a todos;
--   * challenges com user_id = desafios criados pelo usuário;
--   * catalog_marathons agrupam desafios do catálogo; "participar" copia para uma maratona do usuário.
create table challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  created_at timestamptz not null default now()
);
create unique index challenges_system_title_idx on challenges (lower(title)) where user_id is null;
create unique index challenges_user_title_idx on challenges (user_id, lower(title)) where user_id is not null;

create table catalog_marathons (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0
);

create table catalog_marathon_challenges (
  catalog_marathon_id uuid not null references catalog_marathons(id) on delete cascade,
  challenge_id uuid not null references challenges(id) on delete cascade,
  position int not null,
  primary key (catalog_marathon_id, challenge_id)
);

-- o item de uma maratona continua com o título copiado; o vínculo só indica a origem
alter table marathon_challenges
  add column challenge_id uuid references challenges(id) on delete set null;
alter table marathons add column catalog_key text;

alter table challenges enable row level security;
alter table catalog_marathons enable row level security;
alter table catalog_marathon_challenges enable row level security;

create policy challenges_select on challenges
  for select to authenticated using (user_id is null or user_id = auth.uid());
create policy challenges_insert on challenges
  for insert to authenticated with check (user_id = auth.uid());
create policy challenges_update on challenges
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy challenges_delete on challenges
  for delete to authenticated using (user_id = auth.uid());
create policy catalog_marathons_select on catalog_marathons
  for select to authenticated using (true);
create policy catalog_marathon_challenges_select on catalog_marathon_challenges
  for select to authenticated using (true);

-- Catálogo inicial
insert into catalog_marathons (key, name, description, sort_order) values
  ('alfabeto', 'Desafio do Alfabeto', 'Um livro para cada letra: o título precisa começar com ela.', 1),
  ('cores', 'Desafio das Cores', 'Um livro para cada cor de capa.', 2),
  ('meses', 'Um livro por mês', 'Doze meses, doze leituras.', 3),
  ('fora-da-caixa', 'Leitura fora da caixa', 'Doze convites para sair do gênero de sempre.', 4);

insert into challenges (user_id, title)
select null, t from unnest(
  array(select 'Título com a letra ' || chr(64 + i) from generate_series(1, 26) i)
  || array['Capa vermelha', 'Capa azul', 'Capa verde', 'Capa amarela', 'Capa preta',
           'Capa branca', 'Capa rosa', 'Capa roxa', 'Capa laranja', 'Capa dourada']
  || array['Leitura de janeiro', 'Leitura de fevereiro', 'Leitura de março', 'Leitura de abril',
           'Leitura de maio', 'Leitura de junho', 'Leitura de julho', 'Leitura de agosto',
           'Leitura de setembro', 'Leitura de outubro', 'Leitura de novembro', 'Leitura de dezembro']
  || array['Um gênero que você nunca leu', 'Autor ou autora de outro país', 'Mais de 500 páginas',
           'Menos de 150 páginas', 'Indicado por alguém', 'Virou filme ou série', 'Poesia',
           'Quadrinhos ou graphic novel', 'Não ficção', 'Autoria brasileira', 'Uma releitura',
           'Escolhido só pela capa']
) as t;

insert into catalog_marathon_challenges (catalog_marathon_id, challenge_id, position)
select cm.id, c.id, t.ord
from (values
  ('alfabeto', array(select 'Título com a letra ' || chr(64 + i) from generate_series(1, 26) i)),
  ('cores', array['Capa vermelha', 'Capa azul', 'Capa verde', 'Capa amarela', 'Capa preta',
                  'Capa branca', 'Capa rosa', 'Capa roxa', 'Capa laranja', 'Capa dourada']),
  ('meses', array['Leitura de janeiro', 'Leitura de fevereiro', 'Leitura de março', 'Leitura de abril',
                  'Leitura de maio', 'Leitura de junho', 'Leitura de julho', 'Leitura de agosto',
                  'Leitura de setembro', 'Leitura de outubro', 'Leitura de novembro', 'Leitura de dezembro']),
  ('fora-da-caixa', array['Um gênero que você nunca leu', 'Autor ou autora de outro país', 'Mais de 500 páginas',
                          'Menos de 150 páginas', 'Indicado por alguém', 'Virou filme ou série', 'Poesia',
                          'Quadrinhos ou graphic novel', 'Não ficção', 'Autoria brasileira', 'Uma releitura',
                          'Escolhido só pela capa'])
) as m(key, titles)
cross join lateral unnest(m.titles) with ordinality as t(title, ord)
join catalog_marathons cm on cm.key = m.key
join challenges c on c.user_id is null and lower(c.title) = lower(t.title);
