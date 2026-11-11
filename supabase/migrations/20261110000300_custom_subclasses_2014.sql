alter table public.characters
  add column custom_subclass jsonb,
  add constraint characters_custom_subclass_shape check (
    custom_subclass is null or (
      jsonb_typeof(custom_subclass) = 'object'
      and coalesce(jsonb_typeof(custom_subclass->'name') = 'string', false)
      and coalesce(jsonb_typeof(custom_subclass->'features') = 'array', false)
    )
  );

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
