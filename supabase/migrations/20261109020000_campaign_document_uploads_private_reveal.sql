-- Documents importés et révélations ciblées. À appliquer après 20261109010000.
alter table public.campaign_documents add column if not exists kind text not null default 'written';
alter table public.campaign_documents add column if not exists storage_path text;
alter table public.campaign_documents add column if not exists mime_type text;
alter table public.campaign_documents add column if not exists recipient_id uuid references auth.users(id) on delete set null;
alter table public.campaign_documents add constraint campaign_documents_kind_check check(kind in ('written','upload'));
alter table public.campaign_documents add constraint campaign_documents_file_check check (
 (kind='written' and storage_path is null) or (kind='upload' and (storage_path is null or storage_path like campaign_id::text || '/' || id::text || '/%'))
);
-- Le destinataire doit être membre de la campagne. Vérifié côté SQL, pas seulement dans l'interface.
create or replace function public.validate_campaign_document_recipient() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.recipient_id is not null and not exists (
  select 1 from public.campaign_members m where m.campaign_id=new.campaign_id and m.user_id=new.recipient_id
 ) then raise exception 'Le destinataire doit appartenir à la campagne'; end if;
 return new;
end $$;
drop trigger if exists campaign_document_recipient_check on public.campaign_documents;
create trigger campaign_document_recipient_check before insert or update on public.campaign_documents for each row execute function public.validate_campaign_document_recipient();
drop policy if exists "documents_read" on public.campaign_documents;
create policy "documents_read" on public.campaign_documents for select to authenticated using (
 exists(select 1 from public.campaigns c where c.id=campaign_documents.campaign_id and c.owner_id=auth.uid())
 or (published_at is not null and (recipient_id is null or recipient_id=auth.uid())
 and exists(select 1 from public.campaign_members m where m.campaign_id=campaign_documents.campaign_id and m.user_id=auth.uid()))
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('campaign-documents','campaign-documents',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
-- Chemin : campaign_id/document_id/fichier ; aucun accès aux brouillons pour les joueurs.
create policy "campaign_documents_storage_read" on storage.objects for select to authenticated using (
 bucket_id='campaign-documents' and exists (
  select 1 from public.campaign_documents d
  where d.storage_path=name
  and (exists(select 1 from public.campaigns c where c.id=d.campaign_id and c.owner_id=auth.uid())
   or (d.published_at is not null and (d.recipient_id is null or d.recipient_id=auth.uid())
    and exists(select 1 from public.campaign_members m where m.campaign_id=d.campaign_id and m.user_id=auth.uid())))
 )
);
create policy "campaign_documents_storage_insert" on storage.objects for insert to authenticated with check (
 bucket_id='campaign-documents' and exists (
  select 1 from public.campaign_documents d join public.campaigns c on c.id=d.campaign_id
  where c.owner_id=auth.uid() and d.kind='upload' and d.storage_path=name
 )
);
create policy "campaign_documents_storage_delete" on storage.objects for delete to authenticated using (
 bucket_id='campaign-documents' and exists (
  select 1 from public.campaign_documents d join public.campaigns c on c.id=d.campaign_id
  where c.owner_id=auth.uid() and d.storage_path=name
 )
);
