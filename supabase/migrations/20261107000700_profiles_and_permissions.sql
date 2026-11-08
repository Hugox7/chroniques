-- V0.14 · identity, permissions and campaign safeguards
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check (username ~ '^[A-Za-z0-9_]{3,24}$'),
 created_at timestamptz not null default now()
);
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));

-- Existing accounts get a unique, temporary handle; they can rename it in Settings.
insert into public.profiles (id, username)
select id, 'aventurier_' || substr(replace(id::text, '-', ''), 1, 12)
from auth.users on conflict (id) do nothing;

create or replace function public.create_user_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
 v_name := trim(coalesce(new.raw_user_meta_data->>'username', ''));
 if v_name !~ '^[A-Za-z0-9_]{3,24}$' then
   v_name := 'aventurier_' || substr(replace(new.id::text, '-', ''), 1, 12);
 end if;
 insert into public.profiles(id, username) values(new.id, v_name);
 return new;
end;$$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute function public.create_user_profile();

alter table public.profiles enable row level security;
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles update own" on public.profiles for update to authenticated
 using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Explicit grants: RLS continues to govern rows.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;

alter table public.campaigns alter column owner_id set default auth.uid();
drop policy if exists "campaigns read" on public.campaigns;
create policy "campaigns read" on public.campaigns for select to authenticated
 using (owner_id = (select auth.uid()) or public.is_campaign_member(id));

-- Only own characters may be selected. Existing validation trigger enforces this too.
-- Membership is not required to have a character; the owner/MJ may remain without one.
