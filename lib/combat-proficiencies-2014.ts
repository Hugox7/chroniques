import type {Ability,Character} from './rules';

// Saving throw proficiencies from the 2014 Player's Handbook/SRD classes.
const SAVES:Record<string,readonly Ability[]>={
 'Barbare':['FOR','CON'],'Barde':['DEX','CHA'],'Clerc':['SAG','CHA'],
 'Druide':['INT','SAG'],'Guerrier':['FOR','CON'],'Moine':['FOR','DEX'],
 'Paladin':['SAG','CHA'],'Rôdeur':['FOR','DEX'],'Roublard':['DEX','INT'],
 'Ensorceleur':['CON','CHA'],'Occultiste':['SAG','CHA'],'Magicien':['INT','SAG'],
};
// Accept common unaccented and English imports without silently guessing for unknown classes.
const ALIASES:Record<string,string>={barbarian:'Barbare',bard:'Barde',cleric:'Clerc',druid:'Druide',fighter:'Guerrier',monk:'Moine',paladin:'Paladin',ranger:'Rôdeur',rogue:'Roublard',sorcerer:'Ensorceleur',warlock:'Occultiste',wizard:'Magicien',rodeur:'Rôdeur',roublard:'Roublard',ensorceleur:'Ensorceleur'};
export function savingThrowProficiency2014(className:string,ability:Ability):boolean|null {
 const normalized=className.trim();
 const canonical=SAVES[normalized]?normalized:ALIASES[normalized.toLowerCase()];
 return canonical?SAVES[canonical].includes(ability):null;
}
export function characterSavingThrowProficiency2014(character:Pick<Character,'class_name'>,ability:Ability){return savingThrowProficiency2014(character.class_name,ability)}
