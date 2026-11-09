-- Optional roleplay details for D&D 5e 2014 characters.
alter table public.characters
  add column if not exists alignment text not null default 'Neutre',
  add column if not exists age text not null default '',
  add column if not exists height text not null default '',
  add column if not exists appearance text not null default '',
  add column if not exists personality_traits text not null default '',
  add column if not exists ideals text not null default '',
  add column if not exists bonds text not null default '',
  add column if not exists flaws text not null default '',
  add column if not exists languages text not null default '';
