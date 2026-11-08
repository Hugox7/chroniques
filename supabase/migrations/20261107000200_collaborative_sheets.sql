-- V0.3: shared campaign state, atomic operations and audit trail.
-- Apply after 001_initial.sql.
create table public.campaign_character_state (
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 character_id uuid not null references public.characters(id) on delete cascade,
 hp_current integer not null check(hp_current between 0 and 9999),
 hp_max integer not null check(hp_max between 1 and 9999),
 hp_temporary integer not null default 0 check(hp_temporary between 0 and 9999),
 conditions text[] not null default '{}',
 resources jsonb not null default '{}'::jsonb,
 version bigint not null default 0,
 updated_at timestamptz not null default now(),
 primary key(campaign_id,character_id)
);
create table public.campaign_character_events (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 character_id uuid not null references public.characters(id) on delete cascade,
 actor_id uuid not null references auth.users(id),
 action text not null check(action in ('damage','heal','temporary_hp','condition_add','condition_remove','resource_delta')),
 amount integer,
 detail text,
 before_state jsonb not null,
 after_state jsonb not null,
 created_at timestamptz not null default now()
);
create index campaign_character_events_recent_idx on public.campaign_character_events(campaign_id,created_at desc);
create function public.can_manage_campaign_character(p_campaign uuid,p_character uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists (
 select 1 from public.campaign_members m
 join public.campaigns cp on cp.id=m.campaign_id
 join public.characters c on c.id=p_character
 where m.campaign_id=p_campaign and m.character_id=p_character
 and (cp.owner_id=(select auth.uid()) or c.owner_id=(select auth.uid()))
 and public.is_campaign_member(p_campaign)
 )
$$;
alter table public.campaign_character_state enable row level security;
alter table public.campaign_character_events enable row level security;
create policy "campaign state read" on public.campaign_character_state for select to authenticated using(public.is_campaign_member(campaign_id));
create policy "campaign events read" on public.campaign_character_events for select to authenticated using(public.is_campaign_member(campaign_id));
-- No direct client writes: only validated SECURITY DEFINER RPC.
create function public.apply_campaign_character_action(p_campaign uuid,p_character uuid,p_action text,p_amount integer default null,p_detail text default null)
returns public.campaign_character_state language plpgsql security definer set search_path='' as $$
declare v_state public.campaign_character_state;v_before jsonb;v_actor uuid;v_key text;v_value integer;
begin
 v_actor := auth.uid();
 if v_actor is null or not public.can_manage_campaign_character(p_campaign,p_character) then raise exception 'Accès refusé';end if;
 if p_action not in ('damage','heal','temporary_hp','condition_add','condition_remove','resource_delta') then raise exception 'Action inconnue';end if;
 if p_action in ('damage','heal','temporary_hp','resource_delta') and (p_amount is null or abs(p_amount)>9999) then raise exception 'Montant invalide';end if;
 if p_action in ('damage','heal') and p_amount<0 then raise exception 'Montant négatif interdit';end if;
 if p_action in ('condition_add','condition_remove','resource_delta') and (p_detail is null or length(trim(p_detail)) not between 1 and 60) then raise exception 'Détail invalide';end if;
 if p_action in ('condition_add','condition_remove') and p_detail not in ('Aveuglé','Charmé','Assourdi','Effrayé','Agrippé','Incapable d’agir','Invisible','Paralysé','Pétrifié','Empoisonné','À terre','Entravé','Étourdi','Inconscient','Épuisement') then raise exception 'Condition inconnue';end if;
 insert into public.campaign_character_state(campaign_id,character_id,hp_current,hp_max)
 select p_campaign,c.id,c.hp_current,c.hp_max from public.characters c
 join public.campaign_members m on m.character_id=c.id and m.campaign_id=p_campaign
 where c.id=p_character
 on conflict do nothing;
 select * into v_state from public.campaign_character_state where campaign_id=p_campaign and character_id=p_character for update;
 if not found then raise exception 'Personnage non associé';end if;
 v_before := to_jsonb(v_state);
 case p_action
 when 'damage' then
  v_state.hp_current := greatest(0,v_state.hp_current-greatest(0,p_amount-v_state.hp_temporary));
  v_state.hp_temporary := greatest(0,v_state.hp_temporary-p_amount);
 when 'heal' then v_state.hp_current := least(v_state.hp_max,v_state.hp_current+p_amount);
 when 'temporary_hp' then v_state.hp_temporary := greatest(0,p_amount);
 when 'condition_add' then if not (p_detail=any(v_state.conditions)) then v_state.conditions:=array_append(v_state.conditions,p_detail);end if;
 when 'condition_remove' then v_state.conditions:=array_remove(v_state.conditions,p_detail);
 when 'resource_delta' then
  v_key:=trim(p_detail);
  if v_key !~ '^[a-zA-Z0-9_-]{1,60}$' then raise exception 'Clé de ressource invalide';end if;
  v_value:=coalesce((v_state.resources->>v_key)::integer,0)+p_amount;
  if v_value<0 or v_value>9999 then raise exception 'Ressource hors limites';end if;
  v_state.resources:=jsonb_set(v_state.resources,array[v_key],to_jsonb(v_value),true);
 end case;
 update public.campaign_character_state set hp_current=v_state.hp_current,hp_temporary=v_state.hp_temporary,conditions=v_state.conditions,resources=v_state.resources,version=version+1,updated_at=now()
 where campaign_id=p_campaign and character_id=p_character returning * into v_state;
 insert into public.campaign_character_events(campaign_id,character_id,actor_id,action,amount,detail,before_state,after_state)
 values(p_campaign,p_character,v_actor,p_action,p_amount,p_detail,v_before,to_jsonb(v_state));
 return v_state;
end$$;
revoke all on function public.apply_campaign_character_action(uuid,uuid,text,integer,text) from public;
grant execute on function public.apply_campaign_character_action(uuid,uuid,text,integer,text) to authenticated;
do $$begin alter publication supabase_realtime add table public.campaign_character_state;exception when duplicate_object then null;end$$;
do $$begin alter publication supabase_realtime add table public.campaign_character_events;exception when duplicate_object then null;end$$;
