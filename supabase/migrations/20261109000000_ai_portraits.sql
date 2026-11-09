-- Une ligne par personnage, verrouillage atomique des générations.
create table if not exists public.character_ai_portraits (
 character_id uuid primary key references public.characters(id) on delete cascade,
 owner_id uuid not null references auth.users(id),
 status text not null default 'generating' check(status in ('generating','ready','chosen','failed')),
 appearance text not null,
 image_paths text[] not null default '{}',
 chosen_index integer check(chosen_index between 0 and 1),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint portrait_choice_valid check(status <> 'chosen' or (chosen_index is not null and cardinality(image_paths)=2))
);
create index if not exists character_ai_portraits_owner_idx on public.character_ai_portraits(owner_id);
alter table public.character_ai_portraits enable row level security;
-- Toutes les écritures passent par l'API serveur et sa clé service-role.
create policy "Owner can view own portraits" on public.character_ai_portraits for select to authenticated using(owner_id=auth.uid());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('character-ai-portraits','character-ai-portraits',false,5242880,array['image/png'])
on conflict (id) do nothing;
-- Empêcher la modification de la description dès que la génération est lancée.
create or replace function public.lock_generated_portrait_appearance()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if old.appearance is distinct from new.appearance and exists (
   select 1 from public.character_ai_portraits where character_id=old.id and status in ('generating','ready','chosen')
 ) then raise exception 'Apparence verrouillée après génération des portraits'; end if;
 return new;
end $$;
drop trigger if exists lock_generated_portrait_appearance on public.characters;
create trigger lock_generated_portrait_appearance before update of appearance on public.characters
for each row execute function public.lock_generated_portrait_appearance();
