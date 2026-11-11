-- D&D 2014: shared roll history. Dice may be physical or digital; no roll is mandatory.
create table if not exists public.campaign_combat_rolls_2014 (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 character_id uuid not null references public.characters(id) on delete cascade,
 actor_id uuid not null default auth.uid() references auth.users(id),
 kind text not null check(kind in ('attack','save')),
 ability text not null check(ability in ('FOR','DEX','CON','INT','SAG','CHA')),
 source text not null check(source in ('physical','digital')),
 mode text not null check(mode in ('normal','advantage','disadvantage')),
 first_die integer not null check(first_die between 1 and 20),
 second_die integer check(second_die between 1 and 20),
 modifier integer not null check(modifier between -50 and 50),
 target integer not null check(target between 1 and 40),
 created_at timestamptz not null default now(),
 constraint second_die_required check ((mode='normal' and second_die is null) or (mode<>'normal' and second_die is not null))
);
create index if not exists campaign_combat_rolls_2014_recent on public.campaign_combat_rolls_2014(campaign_id,created_at desc);
alter table public.campaign_combat_rolls_2014 enable row level security;
create policy "rolls visible to participants" on public.campaign_combat_rolls_2014 for select to authenticated using (public.is_campaign_member(campaign_id));
create policy "rolls created by character controller" on public.campaign_combat_rolls_2014 for insert to authenticated with check (
 actor_id=auth.uid() and public.is_campaign_member(campaign_id) and
 exists(select 1 from public.campaign_members m where m.campaign_id=campaign_combat_rolls_2014.campaign_id and m.character_id=campaign_combat_rolls_2014.character_id) and
 public.can_manage_campaign_character(campaign_id,character_id)
);
-- Server calculates derived totals when reading; clients cannot change or delete history.
do $$ begin
 alter publication supabase_realtime add table public.campaign_combat_rolls_2014;
exception when duplicate_object then null; end $$;
