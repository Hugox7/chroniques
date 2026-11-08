-- Chroniques & Dés · schema initial (Supabase SQL Editor)
create extension if not exists pgcrypto;
create table public.characters (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 80),race text not null,class_name text not null,background text not null,
 level integer not null default 1 check(level between 1 and 20),abilities jsonb not null,
 hp_current integer not null default 1,hp_max integer not null default 1,notes text not null default '',
 created_at timestamptz not null default now()
);
create table public.campaigns (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 100),description text not null default '',created_at timestamptz not null default now()
);
create table public.campaign_members (
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 character_id uuid references public.characters(id) on delete set null,
 joined_at timestamptz not null default now(),primary key(campaign_id,user_id)
);
create table public.campaign_invites (
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.campaigns(id) on delete cascade,
 email text not null,created_at timestamptz not null default now(),accepted_at timestamptz,
 unique(campaign_id,email)
);
create table public.campaign_messages (
 id uuid primary key default gen_random_uuid(),campaign_id uuid not null references public.campaigns(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(length(body) between 1 and 2000),created_at timestamptz not null default now()
);
create index characters_owner_idx on public.characters(owner_id);
create index campaign_members_user_idx on public.campaign_members(user_id);
create index campaign_messages_campaign_idx on public.campaign_messages(campaign_id,created_at);
create index campaign_invites_email_idx on public.campaign_invites(lower(email));
create function public.is_campaign_member(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.campaign_members where campaign_id=p_id and user_id=(select auth.uid()))$$;
create function public.owns_campaign(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.campaigns where id=p_id and owner_id=(select auth.uid()))$$;
create function public.can_view_character(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.characters c where c.id=p_id and (c.owner_id=(select auth.uid()) or exists(select 1 from public.campaign_members m join public.campaigns cp on cp.id=m.campaign_id where m.character_id=c.id and (cp.owner_id=(select auth.uid()) or public.is_campaign_member(cp.id)))))$$;
create function public.validate_member_character() returns trigger language plpgsql security definer set search_path='' as $$begin if new.character_id is not null and not exists(select 1 from public.characters where id=new.character_id and owner_id=new.user_id) then raise exception 'Le personnage doit appartenir au joueur';end if;return new;end$$;
create trigger member_character_owner before insert or update of character_id on public.campaign_members for each row execute function public.validate_member_character();
create function public.add_campaign_owner() returns trigger language plpgsql security definer set search_path='' as $$begin insert into public.campaign_members(campaign_id,user_id) values(new.id,new.owner_id);return new;end$$;
create trigger campaign_owner_member after insert on public.campaigns for each row execute function public.add_campaign_owner();
alter table public.characters enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_invites enable row level security;
alter table public.campaign_messages enable row level security;
create policy "characters read" on public.characters for select to authenticated using(owner_id=(select auth.uid()) or public.can_view_character(id));
create policy "characters insert" on public.characters for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "characters update" on public.characters for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "characters delete" on public.characters for delete to authenticated using(owner_id=(select auth.uid()));
create policy "campaigns read" on public.campaigns for select to authenticated using(public.is_campaign_member(id));
create policy "campaigns insert" on public.campaigns for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "campaigns update" on public.campaigns for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
create policy "campaigns delete" on public.campaigns for delete to authenticated using(owner_id=(select auth.uid()));
create policy "members read" on public.campaign_members for select to authenticated using(public.is_campaign_member(campaign_id));
create policy "members update own" on public.campaign_members for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "invites read" on public.campaign_invites for select to authenticated using(public.owns_campaign(campaign_id) or lower(email)=lower((select auth.jwt()->>'email')));
create policy "messages read" on public.campaign_messages for select to authenticated using(public.is_campaign_member(campaign_id));
create policy "messages insert" on public.campaign_messages for insert to authenticated with check(author_id=(select auth.uid()) and public.is_campaign_member(campaign_id));
-- Invitations: creator-only RPC, avoids direct client INSERT and exposes no arbitrary membership writes.
create function public.create_campaign_invite(p_campaign_id uuid,p_email text) returns uuid language plpgsql security definer set search_path='' as $$declare v_id uuid;begin if not public.owns_campaign(p_campaign_id) then raise exception 'Non autorisé';end if;if length(trim(p_email))<3 or length(p_email)>320 or position('@' in p_email)=0 then raise exception 'Email invalide';end if;insert into public.campaign_invites(campaign_id,email) values(p_campaign_id,lower(trim(p_email))) on conflict(campaign_id,email) do update set email=excluded.email returning id into v_id;return v_id;end$$;
create function public.accept_campaign_invite(p_invite_id uuid) returns uuid language plpgsql security definer set search_path='' as $$declare v_campaign uuid;begin select campaign_id into v_campaign from public.campaign_invites where id=p_invite_id and lower(email)=lower((select auth.jwt()->>'email')) and accepted_at is null for update;if v_campaign is null then raise exception 'Invitation introuvable';end if;insert into public.campaign_members(campaign_id,user_id) values(v_campaign,(select auth.uid())) on conflict do nothing;update public.campaign_invites set accepted_at=now() where id=p_invite_id;return v_campaign;end$$;
revoke all on function public.create_campaign_invite(uuid,text) from public;
revoke all on function public.accept_campaign_invite(uuid) from public;
grant execute on function public.create_campaign_invite(uuid,text) to authenticated;
grant execute on function public.accept_campaign_invite(uuid) to authenticated;
-- Enable realtime for chat, members and characters; publication may already include tables.
do $$begin alter publication supabase_realtime add table public.campaign_messages;exception when duplicate_object then null;end$$;
do $$begin alter publication supabase_realtime add table public.campaign_members;exception when duplicate_object then null;end$$;
do $$begin alter publication supabase_realtime add table public.characters;exception when duplicate_object then null;end$$;
