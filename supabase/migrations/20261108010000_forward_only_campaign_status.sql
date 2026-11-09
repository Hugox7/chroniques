-- V0.19.13 : transitions irréversibles, sauf pause/reprise.
create or replace function public.guard_draft_campaign_transition()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  if not (
    (old.status='draft' and new.status='recruiting') or
    (old.status='recruiting' and new.status='active') or
    (old.status='active' and new.status in ('paused','completed')) or
    (old.status='paused' and new.status in ('active','completed'))
  ) then
    raise exception 'Transition de statut interdite : % vers %', old.status, new.status;
  end if;
  return new;
end $$;
-- Le trigger existant guard_draft_campaign_transition est conservé et utilise cette fonction.
