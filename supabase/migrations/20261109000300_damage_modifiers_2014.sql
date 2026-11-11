-- D&D 5e 2014: campaign-scoped, DM-managed damage modifiers.
-- Explicit modifiers are not inferred from equipment or species yet.
create table if not exists public.campaign_damage_modifiers_2014 (
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 character_id uuid not null references public.characters(id) on delete cascade,
 damage_type text not null check (damage_type in ('acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder')),
 modifier text not null check (modifier in ('resistance','vulnerability','immunity')),
 source_label text not null check (length(trim(source_label)) between 1 and 120),
 created_at timestamptz not null default now(),
 primary key(campaign_id,character_id,damage_type,modifier,source_label),
 foreign key(campaign_id,character_id) references public.campaign_character_state(campaign_id,character_id) on delete cascade
);
alter table public.campaign_damage_modifiers_2014 enable row level security;
revoke all on public.campaign_damage_modifiers_2014 from anon,authenticated;
-- Only campaign owner (DM) can edit explicit modifiers; clients cannot directly write rows.
create or replace function public.set_campaign_damage_modifier_2014(
 p_campaign uuid,p_character uuid,p_damage_type text,p_modifier text,p_source_label text,p_enabled boolean
) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.campaigns c where c.id=p_campaign and c.owner_id=auth.uid()) then
  raise exception 'Seul le MJ peut modifier les défenses';
 end if;
 if p_damage_type is null or p_damage_type not in ('acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder')
 or p_modifier is null or p_modifier not in ('resistance','vulnerability','immunity')
 or p_source_label is null or length(trim(p_source_label)) not between 1 and 120
 or p_enabled is null then raise exception 'Modificateur invalide';end if;
 if not exists(select 1 from public.campaign_character_state s where s.campaign_id=p_campaign and s.character_id=p_character) then
  raise exception 'Personnage non associé à la campagne';end if;
 if p_enabled then
  insert into public.campaign_damage_modifiers_2014(campaign_id,character_id,damage_type,modifier,source_label)
  values(p_campaign,p_character,p_damage_type,p_modifier,trim(p_source_label)) on conflict do nothing;
 else
  delete from public.campaign_damage_modifiers_2014 where campaign_id=p_campaign and character_id=p_character
  and damage_type=p_damage_type and modifier=p_modifier and source_label=trim(p_source_label);
 end if;
end$$;
revoke all on function public.set_campaign_damage_modifier_2014(uuid,uuid,text,text,text,boolean) from public;
grant execute on function public.set_campaign_damage_modifier_2014(uuid,uuid,text,text,text,boolean) to authenticated;

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
begin
 if auth.uid() is null or not public.can_manage_campaign_character(p_campaign,p_target) then raise exception 'Accès refusé';end if;
 if p_raw is null or p_raw<1 or p_raw>9999 then raise exception 'Dégâts invalides';end if;
 if p_damage_type is null or p_damage_type not in
 ('acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder') then raise exception 'Type de dégâts invalide';end if;
 select * into v_character from public.characters where id=p_target for update;
 if not found then raise exception 'Personnage introuvable';end if;
 -- Authoritative state and modifier lookup after locking target character.
 v_rage := v_character.class_name='Barbare' and v_character.level>=1
  and coalesce(v_character.resource_state->>'rage_active','false')='true'
  and p_damage_type in ('bludgeoning','piercing','slashing');
 select coalesce(bool_or(modifier='resistance'),false),
        coalesce(bool_or(modifier='vulnerability'),false),
        coalesce(bool_or(modifier='immunity'),false)
 into v_resistance,v_vulnerability,v_immunity
 from public.campaign_damage_modifiers_2014
 where campaign_id=p_campaign and character_id=p_target and damage_type=p_damage_type;
 v_resistance:=v_resistance or v_rage;
 -- 2014: immunity takes precedence; resistance and vulnerability cancel; no stacking.
 v_damage:=case when v_immunity then 0
  when v_resistance and not v_vulnerability then floor(p_raw::numeric/2)::integer
  when v_vulnerability and not v_resistance then p_raw*2
  else p_raw end;
 v_detail:='Dégâts '||p_damage_type||'; brut '||p_raw||'; appliqués '||v_damage||
  case when v_immunity then '; immunité' when v_resistance and v_vulnerability then '; résistance/vulnérabilité annulées'
  when v_resistance then '; résistance' when v_vulnerability then '; vulnérabilité' else '' end;
 perform pg_catalog.set_config('app.typed_damage_2014','authorized',true);
 v_result:=public.apply_campaign_interaction(p_campaign,p_target,'damage',v_damage,v_detail,p_source);
 perform pg_catalog.set_config('app.typed_damage_2014','',true);
 return v_result;
end$$;
revoke all on function public.apply_campaign_typed_damage_2014(uuid,uuid,integer,text,uuid) from public;
grant execute on function public.apply_campaign_typed_damage_2014(uuid,uuid,integer,text,uuid) to authenticated;
