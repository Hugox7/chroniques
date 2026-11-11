create table public.session_summaries (
 session_id uuid primary key references public.game_sessions(id) on delete cascade,
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 summary text not null default '' check(char_length(summary)<=4000),
 locations text not null default '' check(char_length(locations)<=2000),
 highlights text not null default '' check(char_length(highlights)<=4000),
 objective text not null default '' check(char_length(objective)<=1000),
 distance_km numeric(12,2) check(distance_km between 0 and 10000000),
 version integer not null default 1,
 updated_at timestamptz not null default now()
);
create index on public.session_summaries(campaign_id);
alter table public.session_summaries enable row level security;
revoke all on public.session_summaries from public,anon,authenticated;
grant select on public.session_summaries to authenticated;
create policy "campaign summary read" on public.session_summaries for select to authenticated
 using(public.is_campaign_member(campaign_id) or public.owns_campaign(campaign_id));

create function public.save_session_summary(p_session uuid,p_version integer,p_data jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_campaign uuid; v_summary public.session_summaries; v_distance numeric;
begin
 select s.campaign_id into v_campaign from public.game_sessions s
 where s.id=p_session and s.status='completed' and public.owns_campaign(s.campaign_id) for update;
 if v_campaign is null then raise exception 'Séance terminée du MJ requise'; end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Résumé invalide'; end if;
 select * into v_summary from public.session_summaries where session_id=p_session for update;
 if coalesce(v_summary.version,0) is distinct from p_version then raise exception 'Le résumé a changé. Ferme le formulaire puis actualise la chronique.'; end if;
 v_distance:=(p_data->>'distance_km')::numeric;
 if v_distance is not null and (v_distance<0 or v_distance>10000000 or round(v_distance,2)<>v_distance) then raise exception 'Distance invalide'; end if;
 insert into public.session_summaries(session_id,campaign_id,summary,locations,highlights,objective,distance_km,version)
 values(p_session,v_campaign,coalesce(p_data->>'summary',''),coalesce(p_data->>'locations',''),
  coalesce(p_data->>'highlights',''),coalesce(p_data->>'objective',''),v_distance,p_version+1)
 on conflict(session_id) do update set summary=excluded.summary,locations=excluded.locations,
  highlights=excluded.highlights,objective=excluded.objective,distance_km=excluded.distance_km,
  version=excluded.version,updated_at=now();
end $$;
revoke all on function public.save_session_summary(uuid,integer,jsonb) from public;
grant execute on function public.save_session_summary(uuid,integer,jsonb) to authenticated;
alter publication supabase_realtime add table public.session_summaries;

drop policy "trade participants read" on public.campaign_trade_events;
create policy "trade participants read" on public.campaign_trade_events for select to authenticated
 using(public.owns_campaign(campaign_id) or (public.is_campaign_member(campaign_id) and action not in ('create_shop','edit_shop','stock')));

-- A character-only restore cannot rewind shared assets.
create or replace function public.restore_session_character(p_snapshot uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.session_character_snapshots;v_current public.characters;
begin
 select * into v from public.session_character_snapshots where id=p_snapshot for update;
 if not found or v.owner_id<>auth.uid() then raise exception 'Sauvegarde inaccessible';end if;
 select * into v_current from public.characters where id=v.character_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Personnage inaccessible';end if;
 if exists(select 1 from public.campaign_trade_events e where e.character_id=v.character_id and e.created_at>=v.created_at)
 then raise exception 'Cette fiche a participé à des échanges depuis la sauvegarde. Une restauration du personnage seul dupliquerait ou supprimerait des biens. Utilise une correction du MJ.'; end if;

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
 custom_subclass=nullif(v.snapshot->'custom_subclass','null'::jsonb),
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

create or replace function public.delete_game_session(p_session uuid,p_confirm_data_loss boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare v_campaign uuid; v_status text; v_events integer; v_snapshots integer; v_summaries integer;
begin
  select campaign_id,status into v_campaign,v_status
  from public.game_sessions where id=p_session for update;
  if v_campaign is null or not public.owns_campaign(v_campaign) then
    raise exception 'Séance introuvable ou accès refusé';
  end if;
  if v_status='active' then
    raise exception 'Terminer la séance avant de la supprimer';
  end if;
  select count(*) into v_events from public.campaign_character_events where session_id=p_session;
  select count(*) into v_snapshots from public.session_character_snapshots where session_id=p_session;
  select count(*) into v_summaries from public.session_summaries where session_id=p_session;
  if (v_events>0 or v_snapshots>0 or v_summaries>0) and not p_confirm_data_loss then
    raise exception 'Cette séance contient % événements, % sauvegardes et % résumés. Confirmation explicite requise',v_events,v_snapshots,v_summaries;
  end if;
  delete from public.game_sessions where id=p_session;
end $$;
revoke all on function public.delete_game_session(uuid,boolean) from public;
grant execute on function public.delete_game_session(uuid,boolean) to authenticated;
