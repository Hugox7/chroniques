-- V0.19.10 - hardening of the GM correction and snapshot workflows.
-- No destructive schema changes. Run on a staging database first.

-- The GM correction RPC is intended exclusively for inter-session corrections.
-- Ensure consent is still valid, the campaign is live and no session is active.
create or replace function public.gm_correct_character(p_campaign uuid,p_character uuid,p_changes jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_owner uuid;
  v_key text;
  v_allowed text[] := array[
    'notes','inventory','resource_state','hp_current','hp_max','temporary_hp',
    'remaining_gold','abilities','level','features','feats','spellbook',
    'spellcasting_notes','skill_proficiencies','death_save_successes',
    'death_save_failures','inspiration','subclass','speed'
  ];
begin
  if auth.uid() is null or not public.owns_campaign(p_campaign) then
    raise exception 'Accès MJ refusé';
  end if;
  if not exists (
    select 1 from public.campaign_members m
    join public.campaigns cp on cp.id = m.campaign_id
    where m.campaign_id = p_campaign and m.character_id = p_character
      and m.allow_gm_outside_session and cp.status <> 'completed'
  ) then
    raise exception 'Autorisation du joueur requise';
  end if;
  if exists (
    select 1 from public.game_sessions
    where campaign_id = p_campaign and status = 'active'
  ) then
    raise exception 'Utiliser les commandes de séance pendant une séance active';
  end if;
  if p_changes is null or jsonb_typeof(p_changes) <> 'object' or p_changes = '{}'::jsonb then
    raise exception 'Modifications invalides';
  end if;
  for v_key in select jsonb_object_keys(p_changes) loop
    if not v_key = any(v_allowed) then
      raise exception 'Champ interdit : %', v_key;
    end if;
  end loop;
  if p_changes ? 'hp_current' and
    ((p_changes->>'hp_current')::integer < 0) then raise exception 'PV invalides'; end if;
  if p_changes ? 'hp_max' and
    ((p_changes->>'hp_max')::integer < 1) then raise exception 'PV max invalides'; end if;
  if p_changes ? 'temporary_hp' and
    ((p_changes->>'temporary_hp')::integer < 0) then raise exception 'PV temporaires invalides'; end if;
  if p_changes ? 'remaining_gold' and
    ((p_changes->>'remaining_gold')::numeric < 0) then raise exception 'Or invalide'; end if;
  if p_changes ? 'level' and
    ((p_changes->>'level')::integer not between 1 and 20) then raise exception 'Niveau invalide'; end if;

  select to_jsonb(c), c.owner_id into v_before, v_owner
  from public.characters c where c.id = p_character for update;
  if v_owner is null then raise exception 'Personnage introuvable'; end if;

  perform set_config('app.authorized_character_edit', 'on', true);
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
  perform set_config('app.authorized_character_edit', 'off', true);
  select to_jsonb(c) into v_after from public.characters c where id=p_character;
  insert into public.character_edit_audit(character_id,campaign_id,actor_id,before_state,after_state)
  values(p_character,p_campaign,auth.uid(),v_before,v_after);
end $$;
revoke all on function public.gm_correct_character(uuid,uuid,jsonb) from public;
grant execute on function public.gm_correct_character(uuid,uuid,jsonb) to authenticated;

-- Reject accidental deletion of a currently running session.
create or replace function public.delete_game_session(p_session uuid,p_confirm_data_loss boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare v_campaign uuid; v_status text; v_events integer; v_snapshots integer;
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
  if (v_events>0 or v_snapshots>0) and not p_confirm_data_loss then
    raise exception 'Cette séance contient % événements et % sauvegardes. Confirmation explicite requise',v_events,v_snapshots;
  end if;
  delete from public.game_sessions where id=p_session;
end $$;
revoke all on function public.delete_game_session(uuid,boolean) from public;
grant execute on function public.delete_game_session(uuid,boolean) to authenticated;
