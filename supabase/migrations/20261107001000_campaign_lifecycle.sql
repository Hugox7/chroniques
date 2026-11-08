-- V0.18 : cycle de vie, suivi et réponses aux invitations.
-- À exécuter une seule fois dans Supabase SQL Editor avant d'utiliser l'interface.
alter table public.campaigns add column if not exists status text not null default 'draft';
alter table public.campaigns drop constraint if exists campaigns_status_check;
alter table public.campaigns add constraint campaigns_status_check check (status in ('draft','recruiting','active','paused','completed'));
alter table public.campaign_invites add column if not exists declined_at timestamptz;
alter table public.campaign_invites add column if not exists expires_at timestamptz;
alter table public.campaign_invites add column if not exists revoked_at timestamptz;

-- Toute modification de statut reste sous la RLS existante (propriétaire uniquement).
-- Réinviter réactive une invitation refusée ou expirée, sans effacer une acceptation.
create or replace function public.create_campaign_invite(p_campaign_id uuid,p_email text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_email text := lower(trim(p_email));
begin
  if not public.owns_campaign(p_campaign_id) then raise exception 'Non autorisé'; end if;
  if length(v_email)<3 or length(v_email)>320 or position('@' in v_email)=0 then raise exception 'Email invalide'; end if;
  if exists(select 1 from public.campaigns where id=p_campaign_id and status='completed') then
    raise exception 'Cette campagne est terminée';
  end if;
  insert into public.campaign_invites(campaign_id,email,expires_at)
  values(p_campaign_id,v_email,now()+interval '30 days')
  on conflict(campaign_id,email) do update
  set created_at=now(),expires_at=now()+interval '30 days',declined_at=null,revoked_at=null
  returning id into v_id;
  return v_id;
end$$;

create or replace function public.accept_campaign_invite(p_invite_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_campaign uuid;
begin
  select i.campaign_id into v_campaign
  from public.campaign_invites i join public.campaigns c on c.id=i.campaign_id
  where i.id=p_invite_id and lower(i.email)=lower((select auth.jwt()->>'email'))
    and i.accepted_at is null and i.declined_at is null and i.revoked_at is null
    and (i.expires_at is null or i.expires_at>now()) and c.status<>'completed'
  for update of i;
  if v_campaign is null then raise exception 'Invitation indisponible ou expirée'; end if;
  insert into public.campaign_members(campaign_id,user_id)
  values(v_campaign,(select auth.uid())) on conflict do nothing;
  update public.campaign_invites set accepted_at=now() where id=p_invite_id;
  return v_campaign;
end$$;

create or replace function public.decline_campaign_invite(p_invite_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.campaign_invites
  set declined_at=now()
  where id=p_invite_id and lower(email)=lower((select auth.jwt()->>'email'))
    and accepted_at is null and declined_at is null and revoked_at is null;
  if not found then raise exception 'Invitation indisponible'; end if;
end$$;

create or replace function public.revoke_campaign_invite(p_invite_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  update public.campaign_invites set revoked_at=now()
  where id=p_invite_id and public.owns_campaign(campaign_id) and accepted_at is null;
  if not found then raise exception 'Invitation indisponible'; end if;
end$$;

revoke all on function public.decline_campaign_invite(uuid) from public,anon;
revoke all on function public.revoke_campaign_invite(uuid) from public,anon;
grant execute on function public.decline_campaign_invite(uuid) to authenticated;
grant execute on function public.revoke_campaign_invite(uuid) to authenticated;
-- Les fonctions existantes conservent leurs autorisations EXECUTE.

-- Mise à niveau de l’invitation des compagnons récents avec la même politique de renouvellement.
create or replace function public.invite_recent_companion(p_campaign_id uuid, p_user_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_email text; v_invite uuid;
begin
  if (select auth.uid()) is null or not public.owns_campaign(p_campaign_id) then raise exception 'Non autorisé'; end if;
  if p_user_id = (select auth.uid()) then raise exception 'Vous êtes déjà maître du jeu'; end if;
  if not exists(select 1 from public.campaign_members mine join public.campaign_members companion on companion.campaign_id=mine.campaign_id where mine.user_id=(select auth.uid()) and companion.user_id=p_user_id) then raise exception 'Ce joueur ne figure pas dans vos compagnons récents'; end if;
  if exists(select 1 from public.campaign_members where campaign_id=p_campaign_id and user_id=p_user_id) then raise exception 'Ce joueur participe déjà à cette campagne'; end if;
  select email into v_email from auth.users where id=p_user_id;
  if v_email is null then raise exception 'Compte introuvable'; end if;
  v_invite := public.create_campaign_invite(p_campaign_id,v_email);
  return v_invite;
end$$;
