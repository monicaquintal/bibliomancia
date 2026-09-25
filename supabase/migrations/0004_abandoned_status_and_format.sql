-- Status de sistema "abandonado" para a estante (além do status já existente na sessão de leitura)
insert into reading_statuses (user_id, key, label, is_system, sort_order) values
  (null, 'abandonado', 'Abandonado', true, 5);

-- Formato usado em cada ciclo de leitura (livro físico, ebook ou audiobook)
alter table reading_sessions
  add column format text check (format in ('livro', 'ebook', 'audiobook'));
