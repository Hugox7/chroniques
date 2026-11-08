-- V0.15: recent companions, without exposing account emails or a global directory.
-- A companion is visible only if both users have participated in the same campaign.
create or replace function public.recent_companions()
returns table(user_id uuid, username text, shared_campaigns bigint, last_played_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, count(distinct other.campaign_id)::bigint,
         max(other.joined_at) as last_played_at
  from public.campaign_members mine
  join public.campaign_members other on other.campaign_id = mine.campaign_id
  join public.profiles p on p.id = other.user_id
  where mine.user_id = (select auth.uid())
    and other.user_id <> mine.user_id
  group by p.id, p.username
  order by max(other.joined_at) desc, p.username
  limit 30;
$$;
revoke all on function public.recent_companions() from public, anon;
grant execute on function public.recent_companions() to authenticated;

-- Invite an existing companion by account ID, without exposing their email.
-- No arbitrary user-ID lookup: the target must be a shared-campaign companion.
create or replace function public.invite_recent_companion(p_campaign_id uuid, p_user_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_email text; v_invite uuid;
begin
  if (select auth.uid()) is null or not public.owns_campaign(p_campaign_id) then
    raise exception 'Non autorisé';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'Vous êtes déjà maître du jeu';
  end if;
  if not exists (
    select 1 from public.campaign_members mine
    join public.campaign_members companion on companion.campaign_id = mine.campaign_id
    where mine.user_id = (select auth.uid()) and companion.user_id = p_user_id
  ) then
    raise exception 'Ce joueur ne figure pas dans vos compagnons récents';
  end if;
  if exists (select 1 from public.campaign_members where campaign_id = p_campaign_id and user_id = p_user_id) then
    raise exception 'Ce joueur participe déjà à cette campagne';
  end if;
  select email into v_email from auth.users where id = p_user_id;
  if v_email is null then raise exception 'Compte introuvable'; end if;
  insert into public.campaign_invites(campaign_id,email)
  values(p_campaign_id, lower(trim(v_email)))
  on conflict(campaign_id,email) do update set email=excluded.email
  returning id into v_invite;
  return v_invite;
end;
$$;
revoke all on function public.invite_recent_companion(uuid,uuid) from public, anon;
grant execute on function public.invite_recent_companion(uuid,uuid) to authenticated;
