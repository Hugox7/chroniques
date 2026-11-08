import { type Ability, mod, proficiency } from './rules';

/** D&D 5e (2014): class saving throw proficiencies. */
export const classSavingThrows: Record<string, readonly Ability[]> = {
  'Barbare':['FOR','CON'], 'Barde':['DEX','CHA'], 'Clerc':['SAG','CHA'],
  'Druide':['INT','SAG'], 'Guerrier':['FOR','CON'], 'Moine':['FOR','DEX'],
  'Paladin':['SAG','CHA'], 'Rôdeur':['FOR','DEX'], 'Roublard':['DEX','INT'],
  'Ensorceleur':['CON','CHA'], 'Occultiste':['SAG','CHA'], 'Magicien':['INT','SAG']
};

export const skillAbilities = [
  ['Acrobaties','DEX'], ['Arcanes','INT'], ['Athlétisme','FOR'], ['Discrétion','DEX'],
  ['Dressage','SAG'], ['Escamotage','DEX'], ['Histoire','INT'], ['Intimidation','CHA'],
  ['Investigation','INT'], ['Médecine','SAG'], ['Nature','INT'], ['Perception','SAG'],
  ['Perspicacité','SAG'], ['Persuasion','CHA'], ['Religion','INT'], ['Représentation','CHA'],
  ['Survie','SAG'], ['Tromperie','CHA']
] as const satisfies readonly (readonly [string, Ability])[];

export function savingThrowBonus(className:string, ability:Ability, score:number, level:number) {
  return mod(score) + (classSavingThrows[className]?.includes(ability) ? proficiency(level) : 0);
}

export function skillBonus(score:number, level:number, trained=false, expertise=false) {
  return mod(score) + (trained ? proficiency(level) * (expertise ? 2 : 1) : 0);
}

/** Standard array before species bonuses, with each value used exactly once. */
export function isStandardArray(scores:Record<Ability,number>) {
  return [8,10,12,13,14,15].every((n)=>Object.values(scores).filter(v=>v===n).length===1);
}
