create table public.campaign_bestiary_favorites (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  monster_id text not null check (monster_id ~ '^[a-z0-9-]{1,120}$'),
  primary key (campaign_id, monster_id)
);

alter table public.campaign_bestiary_favorites enable row level security;
revoke all on public.campaign_bestiary_favorites from public, anon, authenticated;
grant select, insert, delete on public.campaign_bestiary_favorites to authenticated;

create policy "GM manages campaign bestiary favorites"
  on public.campaign_bestiary_favorites for all to authenticated
  using (public.owns_campaign(campaign_id))
  with check (public.owns_campaign(campaign_id));
