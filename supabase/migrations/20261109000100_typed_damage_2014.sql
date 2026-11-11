-- Typed damage is computed in PostgreSQL, never trusted from a browser preview.
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
 v_result:=public.apply_campaign_interaction(p_campaign,p_target,'damage',v_damage,v_detail,p_source);
 return v_result;
end$$;
revoke all on function public.apply_campaign_typed_damage_2014(uuid,uuid,integer,text,uuid) from public;
grant execute on function public.apply_campaign_typed_damage_2014(uuid,uuid,integer,text,uuid) to authenticated;
