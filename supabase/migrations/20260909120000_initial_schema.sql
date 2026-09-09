-- The Stacks: initial schema. See docs/superpowers/specs/2026-09-09-the-stacks-design.md §4.

-- Global book cache. Filled from Open Library on first touch, shared by everyone,
-- so a book's metadata is fetched once for the whole site.
create table public.books (
  id          uuid primary key default gen_random_uuid(),
  ol_work_key text unique not null,
  title       text not null,
  author      text not null,
  pages       int,
  cover_id    int,
  subjects    text[] not null default '{}',
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  handle       text unique,
  display_name text,
  created_at   timestamptz not null default now()
);

create table public.user_books (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  book_id     uuid not null references public.books on delete restrict,
  status      text not null check (status in ('want','reading','finished','abandoned')),
  genre       text not null check (genre in ('fiction','philosophy','science','history','arts','practical')),
  rating      int check (rating between 1 and 5),
  added_at    timestamptz not null default now(),
  finished_at timestamptz,
  unique (user_id, book_id)
);

create table public.sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  user_book_id uuid not null references public.user_books on delete cascade,
  read_on      date not null,
  page_start   int,
  page_end     int,
  minutes      int check (minutes between 0 and 1440),
  mood         text,
  note         text,
  created_at   timestamptz not null default now()
);

create index sessions_user_day_idx on public.sessions (user_id, read_on desc);
create index sessions_book_day_idx on public.sessions (user_book_id, read_on);
create index user_books_user_genre_idx on public.user_books (user_id, genre);

-- Every new account gets a profile row, so the app never has to check.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
