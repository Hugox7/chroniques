-- V0.16: one campaign-wide, auditable action journal.
-- Existing character events are preserved; source defaults to the affected character.
alter table public.campaign_character_events add column if not exists source_character_id uuid references public.characters(id) on delete set null;
alter table public.campaign_character_events add column if not exists undone_event_id uuid references public.campaign_character_events(id);
create unique index if not exists campaign_event_single_undo on public.campaign_character_events(undone_event_id) where undone_event_id is not null;
create index if not exists campaign_events_by_target on public.campaign_character_events(campaign_id,character_id,created_at desc);

-- Apply a change to a target while recording the character responsible for it.
-- Source must belong to this campaign and be controlled by the caller (or caller is MJ).
create or replace function public.apply_campaign_interaction(
 p_campaign uuid,p_target uuid,p_action text,p_amount integer default null,
 p_detail text default null,p_source uuid default null
) returns public.campaign_character_state
language plpgsql security definer set search_path='' as $$
declare v_result public.campaign_character_state;v_source uuid;v_actor uuid:=auth.uid();v_event_id uuid;
begin
 if v_actor is null or not public.can_manage_campaign_character(p_campaign,p_target) then raise exception 'Accès refusé';end if;
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
revoke all on function public.apply_campaign_interaction(uuid,uuid,text,integer,text,uuid) from public;
grant execute on function public.apply_campaign_interaction(uuid,uuid,text,integer,text,uuid) to authenticated;

-- Safe undo: only the most recent change to the target can be undone.
-- It is recorded as a compensating event, never deleted from the audit trail.
create or replace function public.undo_campaign_character_event(p_event uuid)
returns public.campaign_character_state language plpgsql security definer set search_path='' as $$
declare v_event public.campaign_character_events;v_state public.campaign_character_state;v_last uuid;v_result public.campaign_character_state;
begin
 select * into v_event from public.campaign_character_events where id=p_event;
 if not found or v_event.action='undo' then raise exception 'Action introuvable ou non annulable';end if;
 if not public.can_manage_campaign_character(v_event.campaign_id,v_event.character_id) then raise exception 'Accès refusé';end if;
 if v_event.actor_id<>auth.uid() and not exists(select 1 from public.campaigns where id=v_event.campaign_id and owner_id=auth.uid()) then
  raise exception 'Seul son auteur ou le MJ peut annuler cette action';end if;
 select * into v_state from public.campaign_character_state
 where campaign_id=v_event.campaign_id and character_id=v_event.character_id for update;
 if not found then raise exception 'État introuvable';end if;
 select id into v_last from public.campaign_character_events
 where campaign_id=v_event.campaign_id and character_id=v_event.character_id
 order by created_at desc,id desc limit 1;
 if v_last<>p_event or v_state.version<>(v_event.after_state->>'version')::bigint then
  raise exception 'Une autre action a été effectuée depuis. Annulez les actions plus récentes en premier.';
 end if;
 update public.campaign_character_state set
 hp_current=(v_event.before_state->>'hp_current')::integer,
 hp_temporary=(v_event.before_state->>'hp_temporary')::integer,
 conditions=array(select jsonb_array_elements_text(v_event.before_state->'conditions')),
 resources=v_event.before_state->'resources',version=version+1,updated_at=now()
 where campaign_id=v_event.campaign_id and character_id=v_event.character_id returning * into v_result;
 insert into public.campaign_character_events(campaign_id,character_id,actor_id,action,detail,before_state,after_state,source_character_id,undone_event_id)
 values(v_event.campaign_id,v_event.character_id,auth.uid(),'undo','Annulation de '||v_event.action,
 to_jsonb(v_state),to_jsonb(v_result),v_event.source_character_id,p_event);
 return v_result;
end$$;
-- Existing action check constraint must include the compensating undo operation.
alter table public.campaign_character_events drop constraint if exists campaign_character_events_action_check;
alter table public.campaign_character_events add constraint campaign_character_events_action_check
 check(action in ('damage','heal','temporary_hp','condition_add','condition_remove','resource_delta','undo'));
revoke all on function public.undo_campaign_character_event(uuid) from public;
grant execute on function public.undo_campaign_character_event(uuid) to authenticated;
