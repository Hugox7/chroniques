-- Block direct modifications of characters engaged in non-completed campaigns,
-- even while a session is active. Campaign changes must use authorized RPCs.
create or replace function public.guard_engaged_character_write()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if auth.role()='service_role' or current_setting('app.authorized_character_edit',true)='on'
  then return coalesce(new,old); end if;
  if exists (
    select 1 from public.campaign_members m
    join public.campaigns cp on cp.id=m.campaign_id
    where m.character_id=old.id and cp.status <> 'completed'
  ) then
    raise exception 'Personnage engagé : utilisez les actions autorisées depuis la campagne';
  end if;
  return coalesce(new,old);
end $$;
