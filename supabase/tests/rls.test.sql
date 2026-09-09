-- RLS proof. The claim under test: one reader cannot see another reader's library.
begin;
select plan(14);

create extension if not exists pgtap with schema extensions;

-- Two accounts, inserted straight into auth.users so the trigger runs too.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'ada@example.com',  'x', now(), 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'brian@example.com','x', now(), 'authenticated', 'authenticated');

select is(
  (select count(*)::int from public.profiles where id in
     ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222')),
  2, 'signup trigger creates a profile for each new account');

insert into public.books (id, ol_work_key, title, author, pages)
values ('33333333-3333-3333-3333-333333333333', '/works/OL1W', 'Meditations', 'Marcus Aurelius', 254);

-- ---------------------------------------------------------------- as Ada
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$insert into public.user_books (book_id, status, genre)
    values ('33333333-3333-3333-3333-333333333333', 'reading', 'philosophy')$$,
  'a reader can shelve a book without naming themselves');

select is((select count(*)::int from public.user_books), 1, 'and sees it');

select lives_ok(
  $$insert into public.sessions (user_book_id, read_on, page_start, page_end, minutes, note)
    select id, current_date, 1, 40, 45, 'the inquisitor' from public.user_books limit 1$$,
  'a reader can log a session');

select is((select count(*)::int from public.sessions), 1, 'and sees it');

select throws_ok(
  $$insert into public.user_books (user_id, book_id, status, genre)
    values ('22222222-2222-2222-2222-222222222222',
            '33333333-3333-3333-3333-333333333333', 'reading', 'fiction')$$,
  '42501', null, 'a reader cannot shelve a book into someone else''s library');

select lives_ok(
  $$insert into public.books (ol_work_key, title, author)
    values ('/works/OL2W', 'Cosmos', 'Sagan')$$,
  'a reader can add to the shared book cache');

select throws_ok(
  $$update public.books set title = 'Vandalised' where ol_work_key = '/works/OL1W'$$,
  '42501', null, 'but cannot edit what someone else cached');

-- ---------------------------------------------------------------- as Brian
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is((select count(*)::int from public.user_books), 0, 'another reader sees none of her books');
select is((select count(*)::int from public.sessions),   0, 'and none of her sessions');
select is((select count(*)::int from public.profiles),   1, 'and only his own profile');
select is((select count(*)::int from public.books),      2, 'but the whole shared cache');

-- ---------------------------------------------------------------- signed out
set local role anon;
set local request.jwt.claims = null;

select is((select count(*)::int from public.user_books), 0, 'a stranger sees no libraries');
select is((select count(*)::int from public.books),      2, 'but may still browse the cache');

select * from finish();
rollback;
