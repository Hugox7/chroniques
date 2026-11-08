-- V0.13: tighten campaign membership changes. All accounts can create campaigns.
-- Existing policies from 001 remain, except the membership update policy.
drop policy if exists "members update own" on public.campaign_members;
create policy "members update own" on public.campaign_members
 for update to authenticated
 using (user_id = (select auth.uid()) and public.is_campaign_member(campaign_id))
 with check (user_id = (select auth.uid()) and public.is_campaign_member(campaign_id));

create or replace function public.prevent_membership_reassignment()
returns trigger language plpgsql set search_path = '' as $$
begin
 if new.campaign_id is distinct from old.campaign_id or new.user_id is distinct from old.user_id then
  raise exception 'Impossible de transférer une adhésion à une autre campagne ou un autre compte';
 end if;
 return new;
end;
$$;
drop trigger if exists membership_immutable_identity on public.campaign_members;
create trigger membership_immutable_identity
 before update on public.campaign_members
 for each row execute function public.prevent_membership_reassignment();
