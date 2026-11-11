-- Security hardening for legacy untyped damage RPCs.
-- All damage must pass through apply_campaign_typed_damage_2014.
-- A transaction-local flag allows the trusted typed RPC to reuse the existing
-- journal and HP logic while rejecting legacy direct RPC calls.
-- This assumes clients have no arbitrary SQL execution capability and no
-- exposed RPC that can set custom PostgreSQL configuration values.

create or replace function public.apply_campaign_character_action(p_campaign uuid,p_character uuid,p_action text,p_amount integer default null,p_detail text default null)
returns public.campaign_character_state language plpgsql security definer set search_path='' as $$
declare v_state public.campaign_character_state;v_before jsonb;v_actor uuid;v_key text;v_value integer;
begin
 v_actor := auth.uid();
 if v_actor is null or not public.can_manage_campaign_character(p_campaign,p_character) then raise exception 'Accès refusé';end if;
 if p_action='damage' and pg_catalog.current_setting('app.typed_damage_2014',true) is distinct from 'authorized' then raise exception 'Utiliser les dégâts typés 2014';end if;
 if p_action not in ('damage','heal','temporary_hp','condition_add','condition_remove','resource_delta') then raise exception 'Action inconnue';end if;
 if p_action in ('damage','heal','temporary_hp','resource_delta') and (p_amount is null or abs(p_amount)>9999) then raise exception 'Montant invalide';end if;
 if p_action in ('damage','heal') and p_amount<0 then raise exception 'Montant négatif interdit';end if;
 if p_action in ('condition_add','condition_remove','resource_delta') and (p_detail is null or length(trim(p_detail)) not between 1 and 60) then raise exception 'Détail invalide';end if;
 if p_action in ('condition_add','condition_remove') and p_detail not in ('Aveuglé','Charmé','Assourdi','Effrayé','Agrippé','Incapable d’agir','Invisible','Paralysé','Pétrifié','Empoisonné','À terre','Entravé','Étourdi','Inconscient','Épuisement') then raise exception 'Condition inconnue';end if;
 insert into public.campaign_character_state(campaign_id,character_id,hp_current,hp_max)
 select p_campaign,c.id,c.hp_current,c.hp_max from public.characters c
 join public.campaign_members m on m.character_id=c.id and m.campaign_id=p_campaign
 where c.id=p_character
 on conflict do nothing;
 select * into v_state from public.campaign_character_state where campaign_id=p_campaign and character_id=p_character for update;
 if not found then raise exception 'Personnage non associé';end if;
 v_before := to_jsonb(v_state);
 case p_action
 when 'damage' then
  v_state.hp_current := greatest(0,v_state.hp_current-greatest(0,p_amount-v_state.hp_temporary));
  v_state.hp_temporary := greatest(0,v_state.hp_temporary-p_amount);
 when 'heal' then v_state.hp_current := least(v_state.hp_max,v_state.hp_current+p_amount);
 when 'temporary_hp' then v_state.hp_temporary := greatest(0,p_amount);
 when 'condition_add' then if not (p_detail=any(v_state.conditions)) then v_state.conditions:=array_append(v_state.conditions,p_detail);end if;
 when 'condition_remove' then v_state.conditions:=array_remove(v_state.conditions,p_detail);
 when 'resource_delta' then
  v_key:=trim(p_detail);
  if v_key !~ '^[a-zA-Z0-9_-]{1,60}$' then raise exception 'Clé de ressource invalide';end if;
  v_value:=coalesce((v_state.resources->>v_key)::integer,0)+p_amount;
  if v_value<0 or v_value>9999 then raise exception 'Ressource hors limites';end if;
  v_state.resources:=jsonb_set(v_state.resources,array[v_key],to_jsonb(v_value),true);
 end case;
 update public.campaign_character_state set hp_current=v_state.hp_current,hp_temporary=v_state.hp_temporary,conditions=v_state.conditions,resources=v_state.resources,version=version+1,updated_at=now()
 where campaign_id=p_campaign and character_id=p_character returning * into v_state;
 insert into public.campaign_character_events(campaign_id,character_id,actor_id,action,amount,detail,before_state,after_state)
 values(p_campaign,p_character,v_actor,p_action,p_amount,p_detail,v_before,to_jsonb(v_state));
 return v_state;
end$$;

create or replace function public.apply_campaign_interaction(
 p_campaign uuid,p_target uuid,p_action text,p_amount integer default null,
 p_detail text default null,p_source uuid default null
) returns public.campaign_character_state
language plpgsql security definer set search_path='' as $$
declare v_result public.campaign_character_state;v_source uuid;v_actor uuid:=auth.uid();v_event_id uuid;
begin
 if v_actor is null or not public.can_manage_campaign_character(p_campaign,p_target) then raise exception 'Accès refusé';end if;
 if p_action='damage' and pg_catalog.current_setting('app.typed_damage_2014',true) is distinct from 'authorized' then raise exception 'Utiliser les dégâts typés 2014';end if;
 v_source:=coalesce(p_source,p_target);
 if not exists(select 1 from public.campaign_members m join public.campaigns c on c.id=m.campaign_id
  where m.campaign_id=p_campaign and m.character_id=v_source
  and (m.user_id=v_actor or c.owner_id=v_actor)) then
  raise exception 'Source non autorisée dans cette campagne';
 end if;
 v_result:=public.apply_campaign_character_action(p_campaign,p_target,p_action,p_amount,p_detail);
 select e.id into v_event_id from public.campaign_character_events e
 where e.campaign_id=p_campaign and e.character_id=p_target and e.actor_id=v_actor
 order by e.created_at desc,e.id desc limit 1;
 update public.campaign_character_events set source_character_id=v_source where id=v_event_id;
 return v_result;
end$$;

create or replace function public.apply_campaign_typed_damage_2014(
 p_campaign uuid,p_target uuid,p_raw integer,p_damage_type text,p_source uuid default null
) returns public.campaign_character_state
language plpgsql security definer set search_path='' as $$
declare
 v_character public.characters%rowtype;
 v_damage integer;
 v_resistant boolean;
 v_result public.campaign_character_state;
 v_detail text;
begin
 if auth.uid() is null or not public.can_manage_campaign_character(p_campaign,p_target) then
  raise exception 'Accès refusé';
 end if;
 if p_raw is null or p_raw<1 or p_raw>9999 then raise exception 'Dégâts invalides';end if;
 if p_damage_type is null or p_damage_type not in
 ('acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder') then
  raise exception 'Type de dégâts invalide';
 end if;
 -- Serialize character updates and read authoritative rage state in the same transaction.
 select * into v_character from public.characters where id=p_target for update;
 if not found then raise exception 'Personnage introuvable';end if;
 v_resistant := v_character.class_name='Barbare'
  and v_character.level>=1
  and coalesce(v_character.resource_state->>'rage_active','false')='true'
  and p_damage_type in ('bludgeoning','piercing','slashing');
 v_damage:=case when v_resistant then floor(p_raw::numeric/2)::integer else p_raw end;
 v_detail:='Dégâts '||p_damage_type||'; brut '||p_raw||
  case when v_resistant then '; résistance Rage appliquée' else '' end;
 perform pg_catalog.set_config('app.typed_damage_2014','authorized',true);
 v_result:=public.apply_campaign_interaction(p_campaign,p_target,'damage',v_damage,v_detail,p_source);
 perform pg_catalog.set_config('app.typed_damage_2014','',true);
 return v_result;
end$$;

revoke all on function public.apply_campaign_character_action(uuid,uuid,text,integer,text) from public;
grant execute on function public.apply_campaign_character_action(uuid,uuid,text,integer,text) to authenticated;
revoke all on function public.apply_campaign_interaction(uuid,uuid,text,integer,text,uuid) from public;
grant execute on function public.apply_campaign_interaction(uuid,uuid,text,integer,text,uuid) to authenticated;
revoke all on function public.apply_campaign_typed_damage_2014(uuid,uuid,integer,text,uuid) from public;
grant execute on function public.apply_campaign_typed_damage_2014(uuid,uuid,integer,text,uuid) to authenticated;
