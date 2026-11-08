-- Persist character creation choices. Inventory is owned by the character owner;
-- campaign shared-state operations will use dedicated audited RPCs later.
alter table public.characters add column if not exists subrace text not null default '';
alter table public.characters add column if not exists inventory jsonb not null default '[]'::jsonb;
alter table public.characters add constraint characters_inventory_array check (jsonb_typeof(inventory) = 'array');
