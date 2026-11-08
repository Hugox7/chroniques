-- Skill proficiencies chosen during character creation (D&D 5e 2014).
-- Run after 001_initial.sql and 002_collaborative_sheets.sql.
alter table public.characters
  add column if not exists skill_proficiencies jsonb not null default '[]'::jsonb;
alter table public.characters
  add constraint characters_skill_proficiencies_array
  check (jsonb_typeof(skill_proficiencies) = 'array');
