-- V0.19.7: explicit player consent and database-enforced campaign locks.
alter table public.campaign_members add column if not exists allow_gm_outside_session boolean not null default false;

-- Consent belongs to the player, not to the GM. The existing membership update policy
-- allows users to update their own row; the trigger prevents identity and character
-- reassignment from being changed through a consent update.
create or replace function public.guard_campaign_member_consent()
returns trigger language plpgsql set search_path = '' as $$
begin
 if new.allow_gm_outside_session is distinct from old.allow_gm_outside_session
    and auth.uid() is distinct from old.user_id then
  raise exception 'Seul le joueur peut autoriser le MJ';
 end if;
 return new;
end; $$;
drop trigger if exists guard_campaign_member_consent on public.campaign_members;
create trigger guard_campaign_member_consent before update on public.campaign_members
for each row execute function public.guard_campaign_member_consent();

-- Prevent ordinary direct character writes when engaged, unless that character is
-- currently in an active game session. Applies to all columns, not only UI controls.
create or replace function public.guard_engaged_character_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if auth.role() = 'service_role' then return coalesce(new,old); end if;
 if exists (
   select 1 from public.campaign_members m
   join public.campaigns cp on cp.id=m.campaign_id
   where m.character_id=old.id and cp.status <> 'completed'
   and not exists (
     select 1 from public.game_sessions s
     where s.campaign_id=m.campaign_id and s.status='active'
   )
 ) then
   raise exception 'Personnage engagé : modifications possibles uniquement pendant une séance';
 end if;
 return coalesce(new,old);
end; $$;
drop trigger if exists guard_engaged_character_write on public.characters;
create trigger guard_engaged_character_write before update or delete on public.characters
for each row execute function public.guard_engaged_character_write();

-- Campaign actions are also locked when no session is active, except when the
-- GM has explicit consent from the character owner. No direct writes are granted.
create or replace function public.can_manage_campaign_character(p_campaign uuid,p_character uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists (
   select 1 from public.campaign_members m
   join public.campaigns cp on cp.id=m.campaign_id
   join public.characters ch on ch.id=m.character_id
   where m.campaign_id=p_campaign and m.character_id=p_character
   and (cp.owner_id=(select auth.uid()) or ch.owner_id=(select auth.uid()))
   and public.is_campaign_member(p_campaign)
   and (
     exists (select 1 from public.game_sessions s where s.campaign_id=p_campaign and s.status='active')
     or (cp.owner_id=(select auth.uid()) and m.allow_gm_outside_session)
   )
 )
$$;
