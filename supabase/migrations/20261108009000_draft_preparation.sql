-- V0.19.12 : aucun recrutement en brouillon, même via les RPC.
-- Les fonctions d'invitation (e-mail et compagnon récent) passent par create_campaign_invite.
create or replace function public.create_campaign_invite(p_campaign_id uuid,p_email text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_email text := lower(trim(p_email)); v_status text;
begin
  if not public.owns_campaign(p_campaign_id) then raise exception 'Non autorisé'; end if;
  select status into v_status from public.campaigns where id=p_campaign_id for update;
  if v_status is distinct from 'recruiting' and v_status is distinct from 'active' and v_status is distinct from 'paused' then
    raise exception 'Les invitations sont indisponibles en brouillon ou après la fin de la campagne';
  end if;
  if length(v_email)<3 or length(v_email)>320 or position('@' in v_email)=0 then raise exception 'Email invalide'; end if;
  insert into public.campaign_invites(campaign_id,email,expires_at)
  values(p_campaign_id,v_email,now()+interval '30 days')
  on conflict(campaign_id,email) do update
  set created_at=now(),expires_at=now()+interval '30 days',declined_at=null,revoked_at=null
  returning id into v_id;
  return v_id;
end$$;
revoke all on function public.create_campaign_invite(uuid,text) from public,anon;
grant execute on function public.create_campaign_invite(uuid,text) to authenticated;

-- Interdit de sauter le recrutement depuis un brouillon.
create or replace function public.guard_draft_campaign_transition()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status='draft' and new.status not in ('draft','recruiting') then
    raise exception 'Ouvrez le recrutement avant de lancer la campagne';
  end if;
  return new;
end$$;
drop trigger if exists guard_draft_campaign_transition on public.campaigns;
create trigger guard_draft_campaign_transition before update of status on public.campaigns
for each row execute function public.guard_draft_campaign_transition();
