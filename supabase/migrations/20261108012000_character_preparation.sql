-- Preparation-only edits are allowed for a character engaged in a campaign.
-- All other fields remain protected, including during active sessions.
create or replace function public.guard_engaged_character_write()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  v_allowed text[] := array['alignment','age','height','appearance','personality_traits',
    'ideals','bonds','flaws','languages','spellbook','spellcasting_notes','notes'];
begin
  if auth.role()='service_role' or current_setting('app.authorized_character_edit',true)='on'
  then return coalesce(new,old); end if;
  if exists (
    select 1 from public.campaign_members m
    join public.campaigns cp on cp.id=m.campaign_id
    where m.character_id=old.id and cp.status <> 'completed'
  ) then
    if tg_op='DELETE' then
      raise exception 'Impossible de supprimer un personnage engagé dans une campagne';
    end if;
    if old.owner_id is distinct from auth.uid() then
      raise exception 'Seul le propriétaire peut préparer son personnage';
    end if;
    if (to_jsonb(new) - v_allowed) is distinct from (to_jsonb(old) - v_allowed) then
      raise exception 'Personnage engagé : seules les informations de préparation peuvent être modifiées hors séance';
    end if;
  end if;
  return coalesce(new,old);
end $$;
