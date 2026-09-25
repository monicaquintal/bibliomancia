alter table books enable row level security;
alter table reading_statuses enable row level security;
alter table library_entries enable row level security;
alter table reading_sessions enable row level security;
alter table reading_comments enable row level security;

-- books: catálogo compartilhado entre usuários autenticados
create policy books_select on books for select to authenticated using (true);
create policy books_insert on books for insert to authenticated with check (true);
create policy books_update on books for update to authenticated using (true) with check (true);

-- reading_statuses: status de sistema visíveis a todos; customizados só ao dono
create policy reading_statuses_select on reading_statuses
  for select to authenticated using (user_id is null or user_id = auth.uid());
create policy reading_statuses_insert on reading_statuses
  for insert to authenticated with check (user_id = auth.uid() and is_system = false);
create policy reading_statuses_update on reading_statuses
  for update to authenticated using (user_id = auth.uid() and is_system = false)
  with check (user_id = auth.uid() and is_system = false);
create policy reading_statuses_delete on reading_statuses
  for delete to authenticated using (user_id = auth.uid() and is_system = false);

-- library_entries / reading_sessions / reading_comments: isolamento total por dono
create policy library_entries_all on library_entries
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reading_sessions_all on reading_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reading_comments_all on reading_comments
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
