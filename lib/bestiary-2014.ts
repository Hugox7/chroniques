import monsters from '@/data/normalized/monsters-2014.json';

export type BestiaryMonster2014 = typeof monsters[number];

const frenchAliases: Record<string, string> = {
  'dire-wolf': 'loup géant',
  orc: 'orque',
  zombie: 'zombie',
};

export const bestiary2014 = [...monsters].sort((left, right) =>
  left.nameFr.localeCompare(right.nameFr, 'fr') || left.name.localeCompare(right.name, 'en'));

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, "'");

export function searchBestiary2014(search: string) {
  const query = normalize(search.trim());
  return bestiary2014.filter(monster => [monster.nameFr, monster.name, monster.type, frenchAliases[monster.id] ?? '']
    .some(value => normalize(value).includes(query)));
}
