-- Amounts in copper pieces. Every transfer/purchase is atomic and has a retry key.
create table public.campaign_vaults (
 campaign_id uuid primary key references public.campaigns(id) on delete cascade,
 balance_cp bigint not null default 0 check(balance_cp between 0 and 9000000000000),
 location text not null default '' check(char_length(location)<=200),
 version integer not null default 0
);
create table public.campaign_vault_items (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 item jsonb not null check(jsonb_typeof(item)='object' and coalesce(char_length(item->>'name') between 1 and 200,false)),
 quantity integer not null check(quantity between 1 and 999999)
);
create index on public.campaign_vault_items(campaign_id);
create table public.campaign_shops (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 120),
 description text not null default '' check(char_length(description)<=1000),
 is_visible boolean not null default false,
 version integer not null default 0
);
create index on public.campaign_shops(campaign_id);
create table public.campaign_shop_stock (
 id uuid primary key default gen_random_uuid(),
 shop_id uuid not null references public.campaign_shops(id) on delete cascade,
 item jsonb not null check(jsonb_typeof(item)='object' and coalesce(char_length(item->>'name') between 1 and 200,false)),
 price_cp bigint not null check(price_cp between 0 and 1000000000),
 quantity integer not null check(quantity between 0 and 999999)
);
create index on public.campaign_shop_stock(shop_id);
create table public.campaign_trade_events (
 request_id uuid primary key,
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 character_id uuid references public.characters(id) on delete set null,
 actor_id uuid not null default auth.uid() references auth.users(id),
 action text not null,
 fingerprint text not null,
 summary text not null,
 amount_cp bigint not null default 0,
 created_at timestamptz not null default now()
);
create index on public.campaign_trade_events(campaign_id,created_at desc);
create index on public.campaign_trade_events(character_id,created_at);
alter table public.campaign_vaults enable row level security;
alter table public.campaign_vault_items enable row level security;
alter table public.campaign_shops enable row level security;
alter table public.campaign_shop_stock enable row level security;
alter table public.campaign_trade_events enable row level security;
revoke all on public.campaign_vaults,public.campaign_vault_items,public.campaign_shops,public.campaign_shop_stock,public.campaign_trade_events from public,anon,authenticated;
grant select on public.campaign_vaults,public.campaign_vault_items,public.campaign_shops,public.campaign_shop_stock,public.campaign_trade_events to authenticated;
create policy "vault participants read" on public.campaign_vaults for select to authenticated using(public.is_campaign_member(campaign_id) or public.owns_campaign(campaign_id));
create policy "vault items participants read" on public.campaign_vault_items for select to authenticated using(public.is_campaign_member(campaign_id) or public.owns_campaign(campaign_id));
create policy "shops visibility" on public.campaign_shops for select to authenticated using(public.owns_campaign(campaign_id) or (is_visible and public.is_campaign_member(campaign_id)));
create policy "stock visibility" on public.campaign_shop_stock for select to authenticated using(exists(select 1 from public.campaign_shops s where s.id=shop_id));
create policy "trade participants read" on public.campaign_trade_events for select to authenticated using(public.is_campaign_member(campaign_id) or public.owns_campaign(campaign_id));

create function public.economy_inventory_2014(p_inventory jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare v_result jsonb;
begin
 if p_inventory is null or p_inventory='null'::jsonb then return '[]'::jsonb; end if;
 if jsonb_typeof(p_inventory)<>'array' then raise exception 'Inventaire invalide'; end if;
 select coalesce(jsonb_agg(case when jsonb_typeof(e.value)='string' then
  jsonb_build_object('id','legacy-'||(e.ordinality-1)::text,'name',e.value#>>'{}','quantity',1)
  else e.value end order by e.ordinality),'[]'::jsonb) into v_result
 from jsonb_array_elements(p_inventory) with ordinality e;
 return v_result;
end $$;

create function public.campaign_economy_action(p_campaign uuid,p_request uuid,p_action text,p_data jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare
 v_status text; v_gm boolean; v_vault public.campaign_vaults;
 v_event public.campaign_trade_events; v_character public.characters;
 v_shop public.campaign_shops; v_stock public.campaign_shop_stock; v_vault_item public.campaign_vault_items;
 v_amount bigint; v_quantity integer; v_cost bigint; v_personal_cp bigint;
 v_item jsonb; v_inventory jsonb; v_count integer; v_id uuid; v_summary text; v_funding text; v_destination text;
 v_character_id uuid; v_fingerprint text; v_flag text;
begin
 if auth.uid() is null or not (public.is_campaign_member(p_campaign) or public.owns_campaign(p_campaign)) then raise exception 'Accès refusé'; end if;
 if p_request is null or p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Commande invalide'; end if;
 select status into v_status from public.campaigns where id=p_campaign for share;
 v_gm:=public.owns_campaign(p_campaign);
 insert into public.campaign_vaults(campaign_id) values(p_campaign) on conflict do nothing;
 select * into strict v_vault from public.campaign_vaults where campaign_id=p_campaign for update;
 v_fingerprint:=md5(p_action||p_data::text);
 select * into v_event from public.campaign_trade_events where request_id=p_request;
 if found then
  if v_event.campaign_id<>p_campaign or v_event.actor_id<>auth.uid() or v_event.fingerprint<>v_fingerprint then raise exception 'Identifiant de commande déjà utilisé'; end if;
  return;
 end if;
 if v_status not in ('recruiting','active','paused') then raise exception 'Échanges indisponibles pour cette campagne'; end if;
 v_flag:=coalesce(current_setting('app.authorized_character_edit',true),'');
 v_character_id:=(p_data->>'character_id')::uuid;
 if v_character_id is not null then
  select * into v_character from public.characters where id=v_character_id for update;
  if not found or not exists(select 1 from public.campaign_members m where m.campaign_id=p_campaign and m.character_id=v_character_id)
   or (v_character.owner_id<>auth.uid() and not (v_gm and p_action='grant_money')) then
   raise exception 'Choisis ton personnage associé à cette campagne';
  end if;
  v_inventory:=public.economy_inventory_2014(v_character.inventory);
  if v_character.remaining_gold is not null and (v_character.remaining_gold<0 or v_character.remaining_gold*100<>trunc(v_character.remaining_gold*100)) then raise exception 'Solde du personnage à corriger par le MJ'; end if;
  v_personal_cp:=coalesce(v_character.remaining_gold,0)*100;
 end if;

 case p_action
 when 'location' then
  if not v_gm or (p_data->>'version')::integer is distinct from v_vault.version then raise exception 'Actualise le coffre avant de modifier son emplacement'; end if;
  update public.campaign_vaults set location=coalesce(p_data->>'location','') where campaign_id=p_campaign;
  v_summary:='Emplacement du coffre modifié';
 when 'deposit_money','withdraw_money','grant_money' then
  v_amount:=(p_data->>'amount_cp')::bigint;
  if v_amount is null or v_amount not between 1 and 1000000000 then raise exception 'Montant invalide'; end if;
  if p_action='grant_money' then
   if not v_gm then raise exception 'Action réservée au MJ'; end if;
   if v_character_id is null then v_vault.balance_cp:=v_vault.balance_cp+v_amount;
   else v_personal_cp:=v_personal_cp+v_amount; end if;
   v_summary:='Le MJ attribue '||(v_amount::numeric/100)::text||' po à '||coalesce(v_character.name,'la caisse commune');
  else
   if v_character_id is null then raise exception 'Personnage requis'; end if;
   if p_action='deposit_money' then
    if v_personal_cp<v_amount then raise exception 'Argent personnel insuffisant'; end if;
    v_personal_cp:=v_personal_cp-v_amount; v_vault.balance_cp:=v_vault.balance_cp+v_amount;
    v_summary:=v_character.name||' dépose '||(v_amount::numeric/100)::text||' po';
   else
    if v_vault.balance_cp<v_amount then raise exception 'Caisse commune insuffisante'; end if;
    v_personal_cp:=v_personal_cp+v_amount; v_vault.balance_cp:=v_vault.balance_cp-v_amount;
    v_summary:=v_character.name||' retire '||(v_amount::numeric/100)::text||' po';
   end if;
  end if;
 when 'deposit_item','withdraw_item','grant_item' then
  v_quantity:=(p_data->>'quantity')::integer;
  if v_quantity is null or v_quantity not between 1 and 999999 then raise exception 'Quantité invalide'; end if;
  if p_action='grant_item' then
   if not v_gm then raise exception 'Action réservée au MJ'; end if;
   v_item:=jsonb_build_object('name',btrim(p_data->>'name'),'description',left(coalesce(p_data->>'description',''),2000));
   insert into public.campaign_vault_items(campaign_id,item,quantity) values(p_campaign,v_item,v_quantity);
   v_summary:='Le MJ ajoute '||v_quantity||' × '||(v_item->>'name')||' au coffre';
  else
   if v_character_id is null then raise exception 'Personnage requis'; end if;
   if p_action='deposit_item' then
    select count(*) into v_count from jsonb_array_elements(v_inventory) e where e->>'id'=p_data->>'item_id';
    if v_count<>1 then raise exception 'Objet introuvable ou identifiant ambigu'; end if;
    select e into v_item from jsonb_array_elements(v_inventory) e where e->>'id'=p_data->>'item_id';
    if (v_item->>'quantity') is null or (v_item->>'quantity')::integer<v_quantity then raise exception 'Quantité personnelle insuffisante'; end if;
    select coalesce(jsonb_agg(case when e->>'id'=p_data->>'item_id' then
      jsonb_set(e,'{quantity}',to_jsonb((e->>'quantity')::integer-v_quantity)) else e end order by n),'[]'::jsonb)
     into v_inventory from jsonb_array_elements(v_inventory) with ordinality entries(e,n)
     where e->>'id'<>p_data->>'item_id' or (e->>'quantity')::integer>v_quantity;
    v_item:=v_item-'id'-'quantity'-'equipped';
    insert into public.campaign_vault_items(campaign_id,item,quantity) values(p_campaign,v_item,v_quantity);
    v_summary:=v_character.name||' dépose '||v_quantity||' × '||(v_item->>'name');
   else
    select * into v_vault_item from public.campaign_vault_items where id=(p_data->>'item_id')::uuid and campaign_id=p_campaign for update;
    if not found or v_vault_item.quantity<v_quantity then raise exception 'Quantité du coffre insuffisante'; end if;
    v_item:=v_vault_item.item;
    if v_vault_item.quantity=v_quantity then delete from public.campaign_vault_items where id=v_vault_item.id;
    else update public.campaign_vault_items set quantity=quantity-v_quantity where id=v_vault_item.id; end if;
    v_inventory:=v_inventory||jsonb_build_array(v_item||jsonb_build_object('id',gen_random_uuid(),'quantity',v_quantity,'equipped',false));
    v_summary:=v_character.name||' retire '||v_quantity||' × '||(v_item->>'name');
   end if;
  end if;
 when 'create_shop' then
  if not v_gm then raise exception 'Action réservée au MJ'; end if;
  if (select count(*) from public.campaign_shops where campaign_id=p_campaign)>=50 then raise exception 'Maximum de 50 boutiques'; end if;
  insert into public.campaign_shops(campaign_id,name,description) values(p_campaign,btrim(p_data->>'name'),coalesce(p_data->>'description','')) returning id into v_id;
  if jsonb_typeof(p_data->'items') is distinct from 'array' or jsonb_array_length(p_data->'items')>100 then raise exception 'Stock invalide'; end if;
  for v_item in select value from jsonb_array_elements(p_data->'items') loop
   insert into public.campaign_shop_stock(shop_id,item,price_cp,quantity)
   values(v_id,jsonb_build_object('name',btrim(v_item->>'name')),(v_item->>'price_cp')::bigint,(v_item->>'quantity')::integer);
  end loop;
  v_summary:='Boutique créée · '||(p_data->>'name');
 when 'edit_shop','stock' then
  if not v_gm then raise exception 'Action réservée au MJ'; end if;
  select * into v_shop from public.campaign_shops where id=(p_data->>'shop_id')::uuid and campaign_id=p_campaign for update;
  if not found or v_shop.version is distinct from (p_data->>'version')::integer then raise exception 'La boutique a changé. Actualise avant de modifier'; end if;
  if p_action='edit_shop' then
   update public.campaign_shops set name=btrim(p_data->>'name'),description=coalesce(p_data->>'description',''),is_visible=(p_data->>'is_visible')::boolean,version=version+1 where id=v_shop.id;
   v_summary:='Boutique modifiée · '||(p_data->>'name');
  else
   v_item:=jsonb_build_object('name',btrim(p_data->>'name'));
   if p_data->>'stock_id' is null then
    if (select count(*) from public.campaign_shop_stock where shop_id=v_shop.id)>=200 then raise exception 'Maximum de 200 articles par boutique'; end if;
    insert into public.campaign_shop_stock(shop_id,item,price_cp,quantity) values(v_shop.id,v_item,(p_data->>'price_cp')::bigint,(p_data->>'quantity')::integer);
   else
    update public.campaign_shop_stock set item=v_item,price_cp=(p_data->>'price_cp')::bigint,quantity=(p_data->>'quantity')::integer
     where id=(p_data->>'stock_id')::uuid and shop_id=v_shop.id;
    if not found then raise exception 'Article introuvable'; end if;
   end if;
   update public.campaign_shops set version=version+1 where id=v_shop.id;
   v_summary:='Stock modifié · '||v_shop.name;
  end if;
 when 'purchase' then
  select s.* into v_shop from public.campaign_shops s join public.campaign_shop_stock st on st.shop_id=s.id
   where st.id=(p_data->>'stock_id')::uuid and s.campaign_id=p_campaign for update of s;
  if not found or (not v_shop.is_visible and not v_gm) then raise exception 'Boutique indisponible'; end if;
  select * into strict v_stock from public.campaign_shop_stock where id=(p_data->>'stock_id')::uuid for update;
  v_quantity:=(p_data->>'quantity')::integer; v_funding:=p_data->>'funding';v_destination:=p_data->>'destination';
  if v_quantity is null or v_quantity not between 1 and 999999 or v_stock.quantity<v_quantity then raise exception 'Stock insuffisant'; end if;
  if v_stock.price_cp is distinct from (p_data->>'expected_price_cp')::bigint then raise exception 'Le prix a changé. Actualise avant de confirmer'; end if;
  if v_funding not in ('vault','character') or v_destination not in ('vault','character') or v_funding is null or v_destination is null then raise exception 'Paiement ou destination invalide'; end if;
  if (v_funding='character' or v_destination='character') and v_character_id is null then raise exception 'Personnage requis'; end if;
  v_cost:=v_stock.price_cp*v_quantity;
  if v_funding='vault' then
   if v_vault.balance_cp<v_cost then raise exception 'Caisse commune insuffisante'; end if;
   v_vault.balance_cp:=v_vault.balance_cp-v_cost;
  else
   if v_personal_cp<v_cost then raise exception 'Argent personnel insuffisant'; end if;
   v_personal_cp:=v_personal_cp-v_cost;
  end if;
  if v_destination='vault' then insert into public.campaign_vault_items(campaign_id,item,quantity) values(p_campaign,v_stock.item,v_quantity);
  else v_inventory:=v_inventory||jsonb_build_array(v_stock.item||jsonb_build_object('id',gen_random_uuid(),'quantity',v_quantity,'equipped',false)); end if;
  update public.campaign_shop_stock set quantity=quantity-v_quantity where id=v_stock.id;
  update public.campaign_shops set version=version+1 where id=v_shop.id;
  v_summary:=coalesce(v_character.name,'La compagnie')||' achète '||v_quantity||' × '||(v_stock.item->>'name')||' chez '||v_shop.name||' · '||(v_cost::numeric/100)::text||' po';
 else raise exception 'Commande inconnue';
 end case;
 if v_vault.balance_cp not between 0 and 9000000000000 then raise exception 'Solde du coffre hors limites'; end if;
 update public.campaign_vaults set balance_cp=v_vault.balance_cp,version=version+1 where campaign_id=p_campaign;
 if v_character_id is not null then
  if v_personal_cp not between 0 and 9000000000000 or jsonb_array_length(v_inventory)>1000 then raise exception 'Solde ou inventaire hors limites'; end if;
  perform set_config('app.authorized_character_edit','on',true);
  update public.characters set inventory=v_inventory,remaining_gold=v_personal_cp::numeric/100 where id=v_character_id;
  perform set_config('app.authorized_character_edit',v_flag,true);
 end if;
 insert into public.campaign_trade_events(request_id,campaign_id,character_id,actor_id,action,fingerprint,summary,amount_cp)
 values(p_request,p_campaign,v_character_id,auth.uid(),p_action,v_fingerprint,v_summary,coalesce(v_cost,v_amount,0));
end $$;
revoke all on function public.campaign_economy_action(uuid,uuid,text,jsonb) from public;
grant execute on function public.campaign_economy_action(uuid,uuid,text,jsonb) to authenticated;

-- A stale full-character save must not undo a committed trade.
create function public.guard_campaign_economy_character()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.role()='service_role' or current_setting('app.authorized_character_edit',true)='on' then return new; end if;
 if (new.inventory,new.remaining_gold) is distinct from (old.inventory,old.remaining_gold)
   and exists(select 1 from public.campaign_members m join public.campaigns c on c.id=m.campaign_id
     where m.character_id=old.id and c.status<>'completed')
   and exists(select 1 from public.campaign_trade_events e where e.character_id=old.id) then
  raise exception 'Inventaire et argent gérés dans le coffre et les boutiques de la campagne. Actualise la fiche.';
 end if;
 return new;
end $$;
create trigger guard_campaign_economy_character before update on public.characters
for each row execute function public.guard_campaign_economy_character();

do $$ declare t text; begin
 foreach t in array array['campaign_vaults','campaign_vault_items','campaign_shops','campaign_shop_stock','campaign_trade_events'] loop
  execute format('alter publication supabase_realtime add table public.%I',t);
 end loop;
exception when duplicate_object then null; end $$;
