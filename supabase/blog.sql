-- Run once in Supabase → SQL Editor. Creates the blog: posts are written on /admin (Blog posts)
-- and shown on /blog. Visitors can only read published posts; only staff can write.
-- To add another staff member, add their email inside every quoted list below and run again.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 90),
  title text not null check (char_length(title) between 3 and 140),
  excerpt text check (char_length(excerpt) <= 320),
  content_md text not null default '' check (char_length(content_md) <= 60000),
  cover_url text check (cover_url is null or cover_url ~ '^https://'),
  cover_alt text check (char_length(cover_alt) <= 200),
  author_name text not null default 'Team Videh' check (char_length(author_name) <= 80),
  category text check (char_length(category) <= 60),
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  seo_title text check (char_length(seo_title) <= 70),
  seo_description text check (char_length(seo_description) <= 170),
  view_count integer not null default 0,
  read_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_published_idx on public.posts (status, published_at desc);

-- Keep updated_at fresh, and stamp the publish time the first time a post goes live.
create or replace function public.posts_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  return new;
end $$;
drop trigger if exists posts_touch_trg on public.posts;
create trigger posts_touch_trg before insert or update on public.posts
  for each row execute function public.posts_touch();

alter table public.posts enable row level security;

drop policy if exists "Anyone can read published posts" on public.posts;
create policy "Anyone can read published posts" on public.posts for select to anon, authenticated
  using (status = 'published' and published_at <= now());

drop policy if exists "Staff manage posts" on public.posts;
create policy "Staff manage posts" on public.posts for all to authenticated
  using ((auth.jwt() ->> 'email') in ('videhhotels@gmail.com'))
  with check ((auth.jwt() ->> 'email') in ('videhhotels@gmail.com'));

-- Reader tracking: the article page calls this to count a view, and a "read" (reached the end, spent time).
-- It can only add 1 to a published post's counters; visitors cannot change anything else.
create or replace function public.blog_track(p_slug text, p_kind text) returns void
language sql security definer set search_path = public as $$
  update public.posts
     set view_count = view_count + (p_kind = 'view')::int,
         read_count = read_count + (p_kind = 'read')::int
   where slug = p_slug and status = 'published' and published_at <= now() and p_kind in ('view', 'read');
$$;
revoke all on function public.blog_track(text, text) from public;
grant execute on function public.blog_track(text, text) to anon, authenticated;

-- Cover photos: a public storage bucket that only staff can upload to.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog', 'blog', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Staff upload blog images" on storage.objects;
create policy "Staff upload blog images" on storage.objects for insert to authenticated
  with check (bucket_id = 'blog' and (auth.jwt() ->> 'email') in ('videhhotels@gmail.com'));
drop policy if exists "Staff change blog images" on storage.objects;
create policy "Staff change blog images" on storage.objects for update to authenticated
  using (bucket_id = 'blog' and (auth.jwt() ->> 'email') in ('videhhotels@gmail.com'));
drop policy if exists "Staff delete blog images" on storage.objects;
create policy "Staff delete blog images" on storage.objects for delete to authenticated
  using (bucket_id = 'blog' and (auth.jwt() ->> 'email') in ('videhhotels@gmail.com'));
