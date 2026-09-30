-- Capa opcional de uma maratona, escolhida pelo usuário (link de uma imagem).
alter table marathons
  add column cover_url text check (char_length(cover_url) <= 2000);
