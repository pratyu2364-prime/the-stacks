-- RLS. Nothing here is reachable without a policy, and the client never sends
-- user_id: it defaults to auth.uid() and the with-check clauses reject anything else.

alter table public.books      enable row level security;
alter table public.profiles   enable row level security;
alter table public.user_books enable row level security;
alter table public.sessions   enable row level security;

-- books: a shared cache. Anyone may read it, any signed-in user may add to it,
-- and nobody may edit or delete what someone else cached.
create policy books_read on public.books
  for select to anon, authenticated using (true);

create policy books_insert on public.books
  for insert to authenticated with check (true);

create policy profiles_read_own on public.profiles
  for select to authenticated using (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy user_books_select_own on public.user_books
  for select to authenticated using (user_id = auth.uid());

create policy user_books_insert_own on public.user_books
  for insert to authenticated with check (user_id = auth.uid());

create policy user_books_update_own on public.user_books
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_books_delete_own on public.user_books
  for delete to authenticated using (user_id = auth.uid());

create policy sessions_select_own on public.sessions
  for select to authenticated using (user_id = auth.uid());

create policy sessions_insert_own on public.sessions
  for insert to authenticated with check (user_id = auth.uid());

create policy sessions_update_own on public.sessions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy sessions_delete_own on public.sessions
  for delete to authenticated using (user_id = auth.uid());
