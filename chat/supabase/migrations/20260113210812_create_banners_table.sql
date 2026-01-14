create table if not exists banners (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    image_url text not null,
    link_url text,
    sort_order integer default 0,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table banners enable row level security;

-- Allow public read access (for Discover page)
create policy "Enable read access for all users"
on banners for select
using (true);

-- Deny write access to normal users. 
-- The Service Role (used by API routes) bypasses RLS, so this effectively restricts modification to the backend API.
create policy "Deny insert for public"
on banners for insert
with check (false);

create policy "Deny update for public"
on banners for update
using (false);

create policy "Deny delete for public"
on banners for delete
using (false);

-- Storage bucket for banners
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

create policy "Banner images are publicly accessible"
on storage.objects for select
using ( bucket_id = 'banners' );

-- Allow authenticated users to upload to banners bucket
-- For better security in future, consistent with soul_portraits pattern, we check if they are authenticated.
create policy "Allow authenticated uploads to banners"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'banners' );
