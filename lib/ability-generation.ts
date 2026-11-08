import {abilities, type Ability, mod} from './rules';

/** Characteristic generation based on the SRD 5.1 (2014). */
export const STANDARD_ARRAY = [15,14,13,12,10,8] as const;
export type Scores = Record<Ability,number>;
export type GenerationMethod = 'standard' | 'point-buy';
export const POINT_BUY_COST:Record<number,number>={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
export const speciesBonuses: Record<string,Partial<Scores>> = {
  'Humain':{FOR:1,DEX:1,CON:1,INT:1,SAG:1,CHA:1},
  'Elfe':{DEX:2}, 'Nain':{CON:2}, 'Halfelin':{DEX:2},
  'Demi-elfe':{CHA:2}, 'Demi-orque':{FOR:2,CON:1},
  'Gnome':{INT:2}, 'Drakéide':{FOR:2,CHA:1}, 'Tieffelin':{INT:1,CHA:2}
};
/** Only options available in the SRD 5.1. */
export const subraces:Record<string,Record<string,Partial<Scores>>>={
  'Elfe':{'Haut elfe':{INT:1},'Elfe des bois':{SAG:1}},
  'Nain':{'Nain des collines':{SAG:1},'Nain des montagnes':{FOR:2}},
  'Halfelin':{'Pied-léger':{CHA:1},'Costaud':{CON:1}},
  'Gnome':{'Gnome des forêts':{DEX:1},'Gnome des roches':{CON:1}}
};
export const subraceOptions=(race:string)=>Object.keys(subraces[race]??{});
export function validStandardArray(scores:Scores):boolean {
  return [...Object.values(scores)].sort((a,b)=>a-b).join(',') === [...STANDARD_ARRAY].sort((a,b)=>a-b).join(',');
}
export function pointBuySpent(scores:Scores):number {
  if(abilities.some(a=>!Number.isInteger(scores[a])||POINT_BUY_COST[scores[a]]===undefined))return Infinity;
  return abilities.reduce((sum,a)=>sum+POINT_BUY_COST[scores[a]],0);
}
export function validPointBuy(scores:Scores):boolean {return pointBuySpent(scores)===27;}
export function validGeneration(scores:Scores,method:GenerationMethod):boolean {
  return method==='standard'?validStandardArray(scores):validPointBuy(scores);
}
export function validHalfElfChoices(race:string,choices:Ability[]):boolean {
  return race!=='Demi-elfe'||(choices.length===2&&new Set(choices).size===2&&choices.every(a=>abilities.includes(a)&&a!=='CHA'));
}
export function validSubrace(race:string,subrace:string):boolean {
  return !subraces[race] || Object.prototype.hasOwnProperty.call(subraces[race],subrace);
}
export function finalAbilityScores(base:Scores,race:string,halfElfChoices:Ability[]=[],subrace='',method:GenerationMethod='standard'):Scores {
  if(!validGeneration(base,method))throw new Error('Répartition des caractéristiques invalide.');
  if(!validHalfElfChoices(race,halfElfChoices))throw new Error('Le demi-elfe choisit deux caractéristiques différentes hors Charisme.');
  if(!validSubrace(race,subrace))throw new Error('Choisissez une sous-espèce.');
  const bonus=speciesBonuses[race];
  if(!bonus)throw new Error('Espèce inconnue.');
  const subBonus=subraces[race]?.[subrace]??{};
  return Object.fromEntries(abilities.map(a=>[a,base[a]+(bonus[a]??0)+(subBonus[a]??0)+(race==='Demi-elfe'&&halfElfChoices.includes(a)?1:0)])) as Scores;
}
export function abilityBonusSummary(base:Scores,race:string,choices:Ability[]=[],subrace='',method:GenerationMethod='standard'){
  const result=finalAbilityScores(base,race,choices,subrace,method);
  return abilities.map(a=>({ability:a,base:base[a],bonus:result[a]-base[a],total:result[a],modifier:mod(result[a])}));
}
