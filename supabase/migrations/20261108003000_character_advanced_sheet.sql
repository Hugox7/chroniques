-- Advanced editable character sheet fields for 2014 5e. No automatic rules implied.
alter table public.characters
  add column if not exists subclass text not null default '',
  add column if not exists features text not null default '',
  add column if not exists feats text not null default '',
  add column if not exists tool_proficiencies text not null default '',
  add column if not exists weapon_proficiencies text not null default '',
  add column if not exists armor_proficiencies text not null default '',
  add column if not exists spellbook text not null default '',
  add column if not exists spellcasting_notes text not null default '',
  add column if not exists speed numeric not null default 9,
  add column if not exists inspiration boolean not null default false,
  add column if not exists temporary_hp integer not null default 0,
  add column if not exists death_save_successes integer not null default 0,
  add column if not exists death_save_failures integer not null default 0;
