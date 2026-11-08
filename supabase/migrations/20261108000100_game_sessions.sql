-- V0.19: sessions and full character snapshots. Run after V0.18 migrations.
create table if not exists public.game_sessions (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 status text not null default 'active' check(status in ('active','completed','cancelled')),
 started_at timestamptz not null default now(),
 ended_at timestamptz,
 created_by uuid not null references auth.users(id)
);
create unique index if not exists one_active_session_per_campaign on public.game_sessions(campaign_id) where status='active';
create table if not exists public.session_character_snapshots (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.game_sessions(id) on delete cascade,
 character_id uuid not null references public.characters(id) on delete cascade,
 owner_id uuid not null references auth.users(id),
 snapshot jsonb not null,
 created_at timestamptz not null default now(),
 unique(session_id,character_id)
);
create index if not exists snapshot_character_history on public.session_character_snapshots(character_id,created_at desc);
alter table public.game_sessions enable row level security;
alter table public.session_character_snapshots enable row level security;
create policy "sessions read" on public.game_sessions for select to authenticated using(public.is_campaign_member(campaign_id) or public.owns_campaign(campaign_id));
create policy "snapshots own read" on public.session_character_snapshots for select to authenticated using(owner_id=(select auth.uid()));
-- All writes use security-definer RPCs, never direct client table writes.
revoke insert,update,delete on public.game_sessions from authenticated,anon;
revoke insert,update,delete on public.session_character_snapshots from authenticated,anon;
grant select on public.game_sessions,public.session_character_snapshots to authenticated;

create or replace function public.start_game_session(p_campaign uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_session uuid;v_status text;
begin
 if not public.owns_campaign(p_campaign) then raise exception 'Seul le MJ peut lancer une séance';end if;
 select status into v_status from public.campaigns where id=p_campaign for update;
 if v_status <> 'active' then raise exception 'La campagne doit être en cours';end if;
 if exists(select 1 from public.game_sessions where campaign_id=p_campaign and status='active') then raise exception 'Une séance est déjà active';end if;
 insert into public.game_sessions(campaign_id,created_by) values(p_campaign,auth.uid()) returning id into v_session;
 insert into public.session_character_snapshots(session_id,character_id,owner_id,snapshot)
 select v_session,c.id,c.owner_id,to_jsonb(c)
 from public.campaign_members m join public.characters c on c.id=m.character_id
 where m.campaign_id=p_campaign and m.character_id is not null;
 return v_session;
end$$;
create or replace function public.finish_game_session(p_session uuid,p_cancel boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare v_campaign uuid;
begin
 select campaign_id into v_campaign from public.game_sessions where id=p_session and status='active' for update;
 if v_campaign is null or not public.owns_campaign(v_campaign) then raise exception 'Séance introuvable ou accès refusé';end if;
 update public.game_sessions set status=case when p_cancel then 'cancelled' else 'completed' end,ended_at=now() where id=p_session;
end$$;
create or replace function public.delete_game_session(p_session uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_campaign uuid;
begin
 select campaign_id into v_campaign from public.game_sessions where id=p_session for update;
 if v_campaign is null or not public.owns_campaign(v_campaign) then raise exception 'Séance introuvable ou accès refusé';end if;
 -- Does not restore character values. Caller must warn when events have occurred.
 delete from public.game_sessions where id=p_session;
end$$;
create or replace function public.restore_session_character(p_snapshot uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.session_character_snapshots;v_current public.characters;
begin
 select * into v from public.session_character_snapshots where id=p_snapshot for update;
 if not found or v.owner_id<>auth.uid() then raise exception 'Sauvegarde inaccessible';end if;
 select * into v_current from public.characters where id=v.character_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Personnage inaccessible';end if;
 -- Only restore actual character fields; preserve identity, ownership and creation time.
 update public.characters c set
 name=(v.snapshot->>'name'),race=(v.snapshot->>'race'),class_name=(v.snapshot->>'class_name'),
 background=(v.snapshot->>'background'),level=(v.snapshot->>'level')::integer,
 abilities=v.snapshot->'abilities',hp_current=(v.snapshot->>'hp_current')::integer,
 hp_max=(v.snapshot->>'hp_max')::integer,notes=coalesce(v.snapshot->>'notes',''),
 inventory=coalesce(v.snapshot->'inventory','[]'::jsonb),
 skill_proficiencies=coalesce(v.snapshot->'skill_proficiencies','[]'::jsonb),
 subrace=v.snapshot->>'subrace',cleric_domain=v.snapshot->>'cleric_domain',
 starting_gold=(v.snapshot->>'starting_gold')::numeric,
 remaining_gold=(v.snapshot->>'remaining_gold')::numeric,
 equipment_method=v.snapshot->>'equipment_method'
 where c.id=v.character_id;
 delete from public.session_character_snapshots where character_id=v.character_id
 and (created_at>v.created_at or (created_at=v.created_at and id>v.id));
end$$;
revoke all on function public.start_game_session(uuid),public.finish_game_session(uuid,boolean),public.delete_game_session(uuid),public.restore_session_character(uuid) from public;
grant execute on function public.start_game_session(uuid),public.finish_game_session(uuid,boolean),public.delete_game_session(uuid),public.restore_session_character(uuid) to authenticated;
