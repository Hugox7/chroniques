-- V0.19.11 : brouillon non jouable, messagerie verrouillée, suppression réelle par le propriétaire.
-- Le démarrage d'une séance est déjà refusé par start_game_session si status <> 'active'.
-- Sécuriser également l'insertion de messages côté serveur, indépendamment de l'interface.
drop policy if exists "messages insert" on public.campaign_messages;
create policy "messages insert" on public.campaign_messages for insert to authenticated
with check (
  author_id = (select auth.uid())
  and public.is_campaign_member(campaign_id)
  and exists (select 1 from public.campaigns c where c.id = campaign_id and c.status <> 'draft')
);

create or replace function public.delete_campaign_permanently(p_campaign uuid,p_confirm_title text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_title text;
begin
  select c.title into v_title from public.campaigns c
  where c.id = p_campaign and c.owner_id = auth.uid() for update;
  if not found then raise exception 'Campagne introuvable ou suppression non autorisée'; end if;
  if p_confirm_title is distinct from v_title then raise exception 'Le nom de confirmation ne correspond pas'; end if;
  if exists(select 1 from public.game_sessions s where s.campaign_id=p_campaign and s.status='active') then
    raise exception 'Terminez ou annulez la séance active avant de supprimer la campagne';
  end if;
  -- Les relations de campagne sont supprimées en cascade ; les personnages sont conservés.
  -- Les traces d'audit qui utilisent ON DELETE SET NULL restent conservées sans campagne associée.
  delete from public.campaigns where id=p_campaign and owner_id=auth.uid();
  if not found then raise exception 'Suppression impossible'; end if;
end $$;
revoke all on function public.delete_campaign_permanently(uuid,text) from public;
grant execute on function public.delete_campaign_permanently(uuid,text) to authenticated;
