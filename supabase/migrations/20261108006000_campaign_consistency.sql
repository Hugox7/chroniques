-- V0.19.8: one live character, session-aware permissions, snapshots and audit.
-- Run after 20261108005000_campaign_character_lock.sql.

-- A character cannot be assigned to two non-completed campaigns at once.
create or replace function public.prevent_multiple_character_engagements()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.character_id is null then return new; end if;
 perform 1 from public.characters where id=new.character_id for update;
 if exists (
   select 1 from public.campaign_members m join public.campaigns c on c.id=m.campaign_id
   where m.character_id=new.character_id and m.campaign_id<>new.campaign_id
     and c.status <> 'completed'
 ) and exists (select 1 from public.campaigns where id=new.campaign_id and status <> 'completed') then
   raise exception 'Ce personnage est déjà engagé dans une autre campagne';
 end if;
 return new;
end $$;
drop trigger if exists prevent_multiple_character_engagements on public.campaign_members;
create trigger prevent_multiple_character_engagements before insert or update of character_id
on public.campaign_members for each row execute function public.prevent_multiple_character_engagements();

-- Keep HP on the character as the canonical value. A write to the collaborative
-- state updates the canonical row within the same transaction.
create or replace function public.sync_campaign_hp_to_character()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if current_setting('app.sync_character_hp',true)='on' then return new; end if;
 perform set_config('app.sync_character_hp','on',true);
 perform set_config('app.authorized_character_edit','on',true);
 update public.characters set hp_current=new.hp_current, hp_max=new.hp_max,
   temporary_hp=new.hp_temporary where id=new.character_id;
 perform set_config('app.sync_character_hp','off',true);
 perform set_config('app.authorized_character_edit','off',true);
 return new;
end $$;
drop trigger if exists sync_campaign_hp_to_character on public.campaign_character_state;
create trigger sync_campaign_hp_to_character after insert or update of hp_current,hp_max,hp_temporary
on public.campaign_character_state for each row execute function public.sync_campaign_hp_to_character();

create or replace function public.sync_character_hp_to_campaign()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if current_setting('app.sync_character_hp',true)='on' then return new; end if;
 perform set_config('app.sync_character_hp','on',true);
 update public.campaign_character_state set hp_current=new.hp_current,hp_max=new.hp_max,
   hp_temporary=new.temporary_hp,version=version+1,updated_at=now()
 where character_id=new.id and (hp_current,hp_max,hp_temporary)
   is distinct from (new.hp_current,new.hp_max,new.temporary_hp);
 perform set_config('app.sync_character_hp','off',true);
 return new;
end $$;
drop trigger if exists sync_character_hp_to_campaign on public.characters;
create trigger sync_character_hp_to_campaign after update of hp_current,hp_max,temporary_hp
on public.characters for each row execute function public.sync_character_hp_to_campaign();

-- The character guard permits only a trusted security-definer RPC to bypass
-- the between-session lock. The bypass flag is transaction-local.
create or replace function public.guard_engaged_character_write()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.role()='service_role' or current_setting('app.authorized_character_edit',true)='on'
 then return coalesce(new,old); end if;
 if exists (
   select 1 from public.campaign_members m join public.campaigns cp on cp.id=m.campaign_id
   where m.character_id=old.id and cp.status <> 'completed'
   and not exists (select 1 from public.game_sessions s
     where s.campaign_id=m.campaign_id and s.status='active')
 ) then raise exception 'Personnage engagé : modification impossible hors séance'; end if;
 return coalesce(new,old);
end $$;

-- Track which play session each event belongs to, including undo operations.
alter table public.campaign_character_events add column if not exists session_id uuid
 references public.game_sessions(id) on delete set null;
create index if not exists campaign_events_session_idx on public.campaign_character_events(session_id);
create or replace function public.tag_campaign_character_event_session()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 select id into new.session_id from public.game_sessions
 where campaign_id=new.campaign_id and status='active' order by started_at desc limit 1;
 return new;
end $$;
drop trigger if exists tag_campaign_character_event_session on public.campaign_character_events;
create trigger tag_campaign_character_event_session before insert on public.campaign_character_events
for each row execute function public.tag_campaign_character_event_session();

-- Include collaborative state in the snapshot, captured atomically at session start.
create or replace function public.start_game_session(p_campaign uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_session uuid;v_status text;
begin
 if not public.owns_campaign(p_campaign) then raise exception 'Seul le MJ peut lancer une séance'; end if;
 select status into v_status from public.campaigns where id=p_campaign for update;
 if v_status <> 'active' then raise exception 'La campagne doit être en cours'; end if;
 if exists(select 1 from public.game_sessions where campaign_id=p_campaign and status='active')
 then raise exception 'Une séance est déjà active'; end if;
 insert into public.game_sessions(campaign_id,created_by) values(p_campaign,auth.uid()) returning id into v_session;
 insert into public.session_character_snapshots(session_id,character_id,owner_id,snapshot)
 select v_session,c.id,c.owner_id,to_jsonb(c) || jsonb_build_object('_campaign_state',to_jsonb(cs))
 from public.campaign_members m join public.characters c on c.id=m.character_id
 left join public.campaign_character_state cs on cs.campaign_id=m.campaign_id and cs.character_id=c.id
 where m.campaign_id=p_campaign and m.character_id is not null;
 return v_session;
end $$;

-- Prevent snapshot deletion without an explicit destructive confirmation.
-- Existing session events remain in the journal with session_id set null.
create or replace function public.delete_game_session(p_session uuid,p_confirm_data_loss boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare v_campaign uuid;v_events integer;v_snapshots integer;
begin
 select campaign_id into v_campaign from public.game_sessions where id=p_session for update;
 if v_campaign is null or not public.owns_campaign(v_campaign)
 then raise exception 'Séance introuvable ou accès refusé'; end if;
 select count(*) into v_events from public.campaign_character_events where session_id=p_session;
 select count(*) into v_snapshots from public.session_character_snapshots where session_id=p_session;
 if (v_events>0 or v_snapshots>0) and not p_confirm_data_loss
 then raise exception 'Cette séance contient % événements et % sauvegardes. Confirmation explicite requise',v_events,v_snapshots; end if;
 delete from public.game_sessions where id=p_session;
end $$;
revoke all on function public.delete_game_session(uuid,boolean) from public;
grant execute on function public.delete_game_session(uuid,boolean) to authenticated;
-- The old one-argument function must not bypass the confirmation check.
create or replace function public.delete_game_session(p_session uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.delete_game_session(p_session,false);
end $$;

-- Auditable GM corrections outside sessions, with player consent.
create table if not exists public.character_edit_audit (
 id uuid primary key default gen_random_uuid(), character_id uuid not null references public.characters(id) on delete cascade,
 campaign_id uuid references public.campaigns(id) on delete set null,
 actor_id uuid not null references auth.users(id),
 before_state jsonb not null,after_state jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.character_edit_audit enable row level security;
create policy "character audit read" on public.character_edit_audit for select to authenticated
 using(public.can_view_character(character_id));
revoke insert,update,delete on public.character_edit_audit from authenticated,anon;
grant select on public.character_edit_audit to authenticated;

create or replace function public.gm_correct_character(p_campaign uuid,p_character uuid,p_changes jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_before jsonb;v_after jsonb;v_owner uuid;v_allowed text[]:=array[
 'notes','inventory','resource_state','hp_current','hp_max','temporary_hp','remaining_gold',
 'abilities','level','features','feats','spellbook','spellcasting_notes','skill_proficiencies',
 'death_save_successes','death_save_failures','inspiration','subclass','speed'
 ];v_key text;
begin
 if not public.owns_campaign(p_campaign) or not exists (
  select 1 from public.campaign_members where campaign_id=p_campaign
   and character_id=p_character and allow_gm_outside_session
 ) then raise exception 'Autorisation du joueur requise'; end if;
 if jsonb_typeof(p_changes)<>'object' or p_changes='{}'::jsonb then raise exception 'Modifications invalides'; end if;
 for v_key in select jsonb_object_keys(p_changes) loop
  if not v_key=any(v_allowed) then raise exception 'Champ interdit : %',v_key; end if;
 end loop;
 select to_jsonb(c),owner_id into v_before,v_owner from public.characters c where id=p_character for update;
 if v_owner is null then raise exception 'Personnage introuvable'; end if;
 perform set_config('app.authorized_character_edit','on',true);
 update public.characters c set
  notes=coalesce(p_changes->>'notes',c.notes),
  inventory=coalesce(p_changes->'inventory',c.inventory),
  resource_state=coalesce(p_changes->'resource_state',c.resource_state),
  hp_current=coalesce((p_changes->>'hp_current')::integer,c.hp_current),
  hp_max=coalesce((p_changes->>'hp_max')::integer,c.hp_max),
  temporary_hp=coalesce((p_changes->>'temporary_hp')::integer,c.temporary_hp),
  remaining_gold=coalesce((p_changes->>'remaining_gold')::numeric,c.remaining_gold),
  abilities=coalesce(p_changes->'abilities',c.abilities),
  level=coalesce((p_changes->>'level')::integer,c.level),
  features=coalesce(p_changes->>'features',c.features),
  feats=coalesce(p_changes->>'feats',c.feats),
  spellbook=coalesce(p_changes->>'spellbook',c.spellbook),
  spellcasting_notes=coalesce(p_changes->>'spellcasting_notes',c.spellcasting_notes),
  skill_proficiencies=coalesce(p_changes->'skill_proficiencies',c.skill_proficiencies),
  death_save_successes=coalesce((p_changes->>'death_save_successes')::integer,c.death_save_successes),
  death_save_failures=coalesce((p_changes->>'death_save_failures')::integer,c.death_save_failures),
  inspiration=coalesce((p_changes->>'inspiration')::boolean,c.inspiration),
  subclass=coalesce(p_changes->>'subclass',c.subclass),
  speed=coalesce((p_changes->>'speed')::numeric,c.speed)
 where c.id=p_character;
 perform set_config('app.authorized_character_edit','off',true);
 select to_jsonb(c) into v_after from public.characters c where id=p_character;
 insert into public.character_edit_audit(character_id,campaign_id,actor_id,before_state,after_state)
 values(p_character,p_campaign,auth.uid(),v_before,v_after);
end $$;
revoke all on function public.gm_correct_character(uuid,uuid,jsonb) from public;
grant execute on function public.gm_correct_character(uuid,uuid,jsonb) to authenticated;

-- Atomic restore, including campaign state and all advanced character fields.
create or replace function public.restore_session_character(p_snapshot uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.session_character_snapshots;v_current public.characters;
begin
 select * into v from public.session_character_snapshots where id=p_snapshot for update;
 if not found or v.owner_id<>auth.uid() then raise exception 'Sauvegarde inaccessible';end if;
 select * into v_current from public.characters where id=v.character_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Personnage inaccessible';end if;
 if exists(select 1 from public.game_sessions s join public.campaign_members m on m.campaign_id=s.campaign_id
  where m.character_id=v.character_id and s.status='active') then
   raise exception 'Impossible de restaurer pendant une séance active';
 end if;
 perform set_config('app.authorized_character_edit','on',true);
 update public.characters c set
 name=v.snapshot->>'name',race=v.snapshot->>'race',class_name=v.snapshot->>'class_name',
 background=v.snapshot->>'background',level=(v.snapshot->>'level')::integer,
 abilities=v.snapshot->'abilities',hp_current=(v.snapshot->>'hp_current')::integer,
 hp_max=(v.snapshot->>'hp_max')::integer,notes=coalesce(v.snapshot->>'notes',''),
 inventory=coalesce(v.snapshot->'inventory','[]'::jsonb),
 skill_proficiencies=coalesce(v.snapshot->'skill_proficiencies','[]'::jsonb),
 subrace=v.snapshot->>'subrace',cleric_domain=v.snapshot->>'cleric_domain',
 starting_gold=(v.snapshot->>'starting_gold')::numeric,
 remaining_gold=(v.snapshot->>'remaining_gold')::numeric,
 equipment_method=v.snapshot->>'equipment_method',
 alignment=coalesce(v.snapshot->>'alignment',''),age=coalesce(v.snapshot->>'age',''),
 height=coalesce(v.snapshot->>'height',''),appearance=coalesce(v.snapshot->>'appearance',''),
 personality_traits=coalesce(v.snapshot->>'personality_traits',''),ideals=coalesce(v.snapshot->>'ideals',''),
 bonds=coalesce(v.snapshot->>'bonds',''),flaws=coalesce(v.snapshot->>'flaws',''),
 languages=coalesce(v.snapshot->>'languages',''),subclass=coalesce(v.snapshot->>'subclass',''),
 features=coalesce(v.snapshot->>'features',''),feats=coalesce(v.snapshot->>'feats',''),
 tool_proficiencies=coalesce(v.snapshot->>'tool_proficiencies',''),
 weapon_proficiencies=coalesce(v.snapshot->>'weapon_proficiencies',''),
 armor_proficiencies=coalesce(v.snapshot->>'armor_proficiencies',''),
 spellbook=coalesce(v.snapshot->>'spellbook',''),spellcasting_notes=coalesce(v.snapshot->>'spellcasting_notes',''),
 speed=coalesce((v.snapshot->>'speed')::numeric,9),
 inspiration=coalesce((v.snapshot->>'inspiration')::boolean,false),
 temporary_hp=coalesce((v.snapshot->>'temporary_hp')::integer,0),
 death_save_successes=coalesce((v.snapshot->>'death_save_successes')::integer,0),
 death_save_failures=coalesce((v.snapshot->>'death_save_failures')::integer,0),
 resource_state=coalesce(v.snapshot->'resource_state','{}'::jsonb)
 where c.id=v.character_id;
 -- Restore collaborative state only if it existed at the time of capture.
 if jsonb_typeof(v.snapshot->'_campaign_state')='object' then
  update public.campaign_character_state cs set
   hp_current=(v.snapshot->'_campaign_state'->>'hp_current')::integer,
   hp_max=(v.snapshot->'_campaign_state'->>'hp_max')::integer,
   hp_temporary=coalesce((v.snapshot->'_campaign_state'->>'hp_temporary')::integer,0),
   conditions=coalesce(array(select jsonb_array_elements_text(v.snapshot->'_campaign_state'->'conditions')),array[]::text[]),
   resources=coalesce(v.snapshot->'_campaign_state'->'resources','{}'::jsonb),
   version=cs.version+1,updated_at=now()
  where cs.character_id=v.character_id
    and cs.campaign_id=(select campaign_id from public.game_sessions where id=v.session_id);
 end if;
 perform set_config('app.authorized_character_edit','off',true);
 delete from public.session_character_snapshots where character_id=v.character_id
 and (created_at>v.created_at or (created_at=v.created_at and id>v.id));
end$$;

