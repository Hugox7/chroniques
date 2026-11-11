-- Read-only, owner-scoped listing for the DM interface; base table remains inaccessible.
create or replace function public.list_campaign_damage_modifiers_2014(p_campaign uuid,p_character uuid)
returns table(damage_type text,modifier text,source_label text)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.campaigns c where c.id=p_campaign and c.owner_id=auth.uid()) then
  raise exception 'Seul le MJ peut consulter les défenses configurées';
 end if;
 return query select d.damage_type,d.modifier,d.source_label from public.campaign_damage_modifiers_2014 d
 where d.campaign_id=p_campaign and d.character_id=p_character order by d.damage_type,d.modifier,d.source_label;
end$$;
revoke all on function public.list_campaign_damage_modifiers_2014(uuid,uuid) from public;
grant execute on function public.list_campaign_damage_modifiers_2014(uuid,uuid) to authenticated;

-- Replaces the typed damage handler with racial defenses from the 2014 SRD.
-- The client never supplies the race, subclass or damage modifiers.
create or replace function public.apply_campaign_typed_damage_2014(
 p_campaign uuid,p_target uuid,p_raw integer,p_damage_type text,p_source uuid default null
) returns public.campaign_character_state
language plpgsql security definer set search_path='' as $$
declare
 v_character public.characters%rowtype;
 v_damage integer;
 v_rage boolean;
 v_resistance boolean;
 v_vulnerability boolean;
 v_immunity boolean;
 v_result public.campaign_character_state;
 v_detail text;
 v_racial text:='';
begin
 if auth.uid() is null or not public.can_manage_campaign_character(p_campaign,p_target) then raise exception 'Accès refusé';end if;
 if p_raw is null or p_raw<1 or p_raw>9999 then raise exception 'Dégâts invalides';end if;
 if p_damage_type is null or p_damage_type not in
 ('acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder') then raise exception 'Type de dégâts invalide';end if;
 select * into v_character from public.characters where id=p_target for update;
 if not found then raise exception 'Personnage introuvable';end if;
 v_rage := v_character.class_name='Barbare' and v_character.level>=1
  and coalesce(v_character.resource_state->>'rage_active','false')='true'
  and p_damage_type in ('bludgeoning','piercing','slashing');
 select coalesce(bool_or(d.modifier='resistance'),false),
        coalesce(bool_or(d.modifier='vulnerability'),false),
        coalesce(bool_or(d.modifier='immunity'),false)
 into v_resistance,v_vulnerability,v_immunity
 from public.campaign_damage_modifiers_2014 d
 where d.campaign_id=p_campaign and d.character_id=p_target and d.damage_type=p_damage_type;
 -- 2014 racial features with unambiguous, persisted character choices.
 if (v_character.race='Tieffelin' and p_damage_type='fire') then
  v_resistance:=true;v_racial:='; résistance raciale (Tieffelin)';
 elsif (v_character.race='Nain' and p_damage_type='poison') then
  v_resistance:=true;v_racial:='; résistance raciale (Nain)';
 elsif (v_character.race='Halfelin' and v_character.subrace='Costaud' and p_damage_type='poison') then
  v_resistance:=true;v_racial:='; résistance raciale (Halfelin costaud)';
 end if;
 -- Monk level 10: Purity of Body (poison immunity).
 if v_character.class_name='Moine' and v_character.level>=10 and p_damage_type='poison' then
  v_immunity:=true;v_racial:='; Pureté du corps (Moine)';
 end if;
 v_resistance:=v_resistance or v_rage;
 v_damage:=case when v_immunity then 0
  when v_resistance and not v_vulnerability then floor(p_raw::numeric/2)::integer
  when v_vulnerability and not v_resistance then p_raw*2
  else p_raw end;
 v_detail:='Dégâts '||p_damage_type||'; brut '||p_raw||'; appliqués '||v_damage||
  case when v_immunity then '; immunité' when v_resistance and v_vulnerability then '; résistance/vulnérabilité annulées'
  when v_resistance then '; résistance' when v_vulnerability then '; vulnérabilité' else '' end||v_racial;
 perform pg_catalog.set_config('app.typed_damage_2014','authorized',true);
 v_result:=public.apply_campaign_interaction(p_campaign,p_target,'damage',v_damage,v_detail,p_source);
 perform pg_catalog.set_config('app.typed_damage_2014','',true);
 return v_result;
end$$;
revoke all on function public.apply_campaign_typed_damage_2014(uuid,uuid,integer,text,uuid) from public;
grant execute on function public.apply_campaign_typed_damage_2014(uuid,uuid,integer,text,uuid) to authenticated;
