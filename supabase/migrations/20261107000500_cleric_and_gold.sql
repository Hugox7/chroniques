-- 005: équipement et domaine du clerc (SRD 5.1)
alter table public.characters add column if not exists cleric_domain text;
alter table public.characters add column if not exists equipment_method text default 'kit';
alter table public.characters add column if not exists starting_gold numeric(10,2);
alter table public.characters add column if not exists remaining_gold numeric(10,2);
