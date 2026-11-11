import { mod, type Character, type DefenseEquipment2014, type InventoryItem2014 } from './rules';
import armorSource from '../data/sources/open5e/srd-2014/armor.json';

const frenchNames: Record<string, string> = {
  breastplate: 'Cuirasse', 'chain-mail': 'Cotte de mailles', 'chain-shirt': 'Chemise de mailles',
  'half-plate': 'Demi-plate', hide: 'Armure de peaux', leather: 'Armure de cuir',
  padded: 'Armure matelassée', plate: 'Harnois', 'ring-mail': 'Broigne',
  'scale-mail': 'Armure d’écailles', shield: 'Bouclier', splint: 'Clibanion',
  'studded-leather': 'Armure de cuir clouté',
};

export const armorCatalog2014 = armorSource.flatMap(entry => {
  const name = frenchNames[entry.slug];
  if (!name) return [];
  const defense: DefenseEquipment2014 = entry.category === 'Shield'
    ? { kind: 'shield', bonus: entry.plus_flat_mod }
    : {
        kind: 'armor', base: entry.base_ac,
        dexterity: !entry.plus_dex_mod ? 'none' : entry.plus_max > 0 ? 'capped' : 'full',
        ...(entry.plus_dex_mod && entry.plus_max > 0 ? { dexterityCap: entry.plus_max } : {}),
      };
  return [{ id: entry.slug, name, englishName: entry.name, defense }];
});

const normalizeName = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const aliases: Record<string, string> = {
  'bouclier en bois': 'shield', 'bouclier en metal': 'shield',
  'armure de plates': 'plate', 'armure de peau': 'hide', 'cotte d ecailles': 'scale-mail',
};

export function normalizeInventory2014(inventory: Character['inventory']): InventoryItem2014[] {
  return (inventory ?? []).map((item, index) => typeof item === 'string'
    ? { id: `legacy-${index}`, name: item, quantity: 1 }
    : item).filter(item => item && typeof item.name === 'string');
}

const validInteger = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

export function validDefense2014(defense: DefenseEquipment2014): boolean {
  if (!defense) return false;
  if (defense.kind === 'shield') return validInteger(defense.bonus, 0, 30);
  return defense.kind === 'armor' && validInteger(defense.base, 1, 40)
    && (defense.dexterity === 'none' || defense.dexterity === 'full'
      || (defense.dexterity === 'capped' && validInteger(defense.dexterityCap, 0, 10)));
}

export function itemDefense2014(item: InventoryItem2014): DefenseEquipment2014 | undefined {
  if (item.defense !== undefined) return validDefense2014(item.defense) ? item.defense : undefined;
  const name = normalizeName(item.name);
  return armorCatalog2014.find(entry => entry.id === aliases[name]
    || normalizeName(entry.name) === name || normalizeName(entry.englishName) === name)?.defense;
}

export function equippedArmorClass2014(character: Pick<Character, 'abilities' | 'inventory'>) {
  const dexterity = mod(character.abilities.DEX);
  const equipped = normalizeInventory2014(character.inventory).flatMap(item => {
    const defense = item.equipped === true && item.quantity > 0 ? itemDefense2014(item) : undefined;
    return defense ? [{ item, defense }] : [];
  });
  const armor = equipped.find(entry => entry.defense.kind === 'armor');
  const shield = equipped.find(entry => entry.defense.kind === 'shield');
  const rule = armor?.defense;
  let base = 10 + dexterity;
  if (rule?.kind === 'armor') {
    const modifier = rule.dexterity === 'none' ? 0
      : rule.dexterity === 'capped' ? Math.min(dexterity, rule.dexterityCap ?? 0) : dexterity;
    base = rule.base + modifier;
  }
  return { total: base + (shield?.defense.kind === 'shield' ? shield.defense.bonus : 0),
    armor: armor?.item.name, shield: shield?.item.name };
}
