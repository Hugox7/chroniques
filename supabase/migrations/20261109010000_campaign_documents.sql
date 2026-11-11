-- Documents narratifs de campagne : brouillons privés du MJ, publication contrôlée.
create table if not exists public.campaign_documents (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 author_id uuid not null references auth.users(id),
 template text not null default 'parchment' check (template in ('parchment','wanted','ancient')),
 title text not null check (char_length(title) between 1 and 160),
 body text not null default '' check (char_length(body) <= 20000),
 subtitle text not null default '' check (char_length(subtitle) <= 240),
 signature text not null default '' check (char_length(signature) <= 160),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists campaign_documents_order on public.campaign_documents(campaign_id,created_at desc);
alter table public.campaign_documents enable row level security;
revoke all on public.campaign_documents from anon;
grant select,insert,update,delete on public.campaign_documents to authenticated;
create policy "documents_read" on public.campaign_documents for select to authenticated using (
 exists (select 1 from public.campaigns c where c.id=campaign_id and c.owner_id=auth.uid())
 or (published_at is not null and exists(select 1 from public.campaign_members m where m.campaign_id=campaign_id and m.user_id=auth.uid()))
);
create policy "documents_create" on public.campaign_documents for insert to authenticated with check (
 author_id=auth.uid() and exists(select 1 from public.campaigns c where c.id=campaign_id and c.owner_id=auth.uid())
);
create policy "documents_edit" on public.campaign_documents for update to authenticated using (
 exists(select 1 from public.campaigns c where c.id=campaign_id and c.owner_id=auth.uid())
) with check (
 author_id=auth.uid() and exists(select 1 from public.campaigns c where c.id=campaign_id and c.owner_id=auth.uid())
);
create policy "documents_delete" on public.campaign_documents for delete to authenticated using (
 exists(select 1 from public.campaigns c where c.id=campaign_id and c.owner_id=auth.uid())
);
-- Realtime: le client rafraîchit sa liste après insertion / publication.
do $$ begin
 alter publication supabase_realtime add table public.campaign_documents;
exception when duplicate_object then null;
end $$;
