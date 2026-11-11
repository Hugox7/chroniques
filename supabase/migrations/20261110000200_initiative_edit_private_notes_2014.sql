create table public.campaign_private_notes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000 and body ~ '[^[:space:]]'),
  created_at timestamptz not null default now()
);

create index campaign_private_notes_recent
  on public.campaign_private_notes(campaign_id, author_id, created_at desc);

alter table public.campaign_private_notes enable row level security;
revoke all on public.campaign_private_notes from public, anon, authenticated;
grant select on public.campaign_private_notes to authenticated;
grant insert (campaign_id, body) on public.campaign_private_notes to authenticated;

create policy "participants read their own campaign notes"
  on public.campaign_private_notes for select to authenticated
  using (author_id = (select auth.uid())
    and (public.is_campaign_member(campaign_id) or public.owns_campaign(campaign_id)));

create policy "participants add their own campaign notes"
  on public.campaign_private_notes for insert to authenticated
  with check (author_id = (select auth.uid())
    and (public.is_campaign_member(campaign_id) or public.owns_campaign(campaign_id)));

create or replace function public.update_session_initiative_2014(
  p_session uuid, p_version integer, p_action text,
  p_entry uuid default null, p_character uuid default null,
  p_name text default null, p_score integer default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_campaign uuid;
  v_state public.session_initiative_2014%rowtype;
  v_name text;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  -- Lock the session before touching initiative, so finishing the session and editing its combat are serialized.
  select s.campaign_id into v_campaign from public.game_sessions s
    where s.id = p_session and s.status = 'active' and public.owns_campaign(s.campaign_id)
    for update;
  if v_campaign is null then raise exception 'Séance active du MJ requise'; end if;

  insert into public.session_initiative_2014(session_id) values (p_session)
    on conflict (session_id) do nothing;
  select * into strict v_state from public.session_initiative_2014 i where i.session_id = p_session;
  if v_state.version is distinct from p_version then
    raise exception 'L’initiative a changé. Réessayez après actualisation.';
  end if;

  case p_action
    when 'add' then
      if v_state.round <> 0 or jsonb_array_length(v_state.entries) >= 100
        or p_score is null or p_score not between -100 and 100 then
        raise exception 'Ajout de combattant invalide';
      end if;
      if p_character is not null then
        select c.name into v_name from public.characters c
        where c.id = p_character and exists (
          select 1 from public.campaign_members m
          where m.campaign_id = v_campaign and m.character_id = c.id
        );
        if exists (select 1 from jsonb_array_elements(v_state.entries) e where e->>'id' = p_character::text) then
          raise exception 'Ce personnage est déjà dans l’ordre d’initiative';
        end if;
      else
        v_name := btrim(p_name);
      end if;
      if v_name is null or char_length(v_name) not between 1 and 120 then
        raise exception 'Nom du combattant invalide';
      end if;
      v_state.entries := v_state.entries || jsonb_build_array(jsonb_build_object(
        'id', coalesce(p_character, gen_random_uuid()), 'name', v_name, 'score', p_score
      ));
    when 'edit_score' then
      if v_state.round <> 0 or p_entry is null or p_score is null or p_score not between -100 and 100
        or not exists (
          select 1 from jsonb_array_elements(v_state.entries) e where e->>'id' = p_entry::text
        ) then
        raise exception 'Modification du score invalide';
      end if;
      -- Keep insertion order so correcting a score does not change the tie breaker.
      select jsonb_agg(
        case when e.value->>'id' = p_entry::text then jsonb_set(e.value, '{score}', to_jsonb(p_score))
          else e.value end order by e.ordinality
      ) into v_state.entries
      from jsonb_array_elements(v_state.entries) with ordinality e;
    when 'remove' then
      if v_state.round <> 0 or p_entry is null then raise exception 'Retrait invalide'; end if;
      select coalesce(jsonb_agg(e.value order by e.ordinality), '[]'::jsonb) into v_state.entries
        from jsonb_array_elements(v_state.entries) with ordinality e
        where e.value->>'id' <> p_entry::text;
    when 'start' then
      if v_state.round <> 0 or jsonb_array_length(v_state.entries) = 0 then
        raise exception 'Ajoutez des combattants avant de commencer';
      end if;
      select jsonb_agg(e.value order by (e.value->>'score')::integer desc, e.ordinality)
        into v_state.entries from jsonb_array_elements(v_state.entries) with ordinality e;
      v_state.round := 1;
      v_state.turn_index := 0;
    when 'next' then
      if v_state.round = 0 then raise exception 'Aucun combat en cours'; end if;
      v_state.turn_index := v_state.turn_index + 1;
      if v_state.turn_index >= jsonb_array_length(v_state.entries) then
        v_state.turn_index := 0;
        v_state.round := v_state.round + 1;
      end if;
    when 'finish' then
      if v_state.round = 0 then raise exception 'Aucun combat en cours'; end if;
      v_state.round := 0;
      v_state.turn_index := 0;
      v_state.entries := '[]'::jsonb;
    else
      raise exception 'Action d’initiative inconnue';
  end case;

  update public.session_initiative_2014 i set
    entries = v_state.entries, round = v_state.round, turn_index = v_state.turn_index,
    version = v_state.version + 1
  where i.session_id = p_session;
end;
$$;
