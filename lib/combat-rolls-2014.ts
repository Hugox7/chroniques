import type {Ability} from './rules';

export type D20Outcome={die:number;modifier:number;total:number;critical:boolean;automaticMiss:boolean};
export type RollMode='normal'|'advantage'|'disadvantage';
export function abilityModifier(score:number):number {return Math.floor((score-10)/2)}
export function proficiencyBonus(level:number):number {return 2+Math.floor((Math.max(1,Math.min(20,level))-1)/4)}
export function chooseD20(first:number,second:number,mode:RollMode):number {
 if(![first,second].every(n=>Number.isInteger(n)&&n>=1&&n<=20))throw new Error('Invalid d20');
 return mode==='advantage'?Math.max(first,second):mode==='disadvantage'?Math.min(first,second):first;
}
export function resolveAttack(die:number,modifier:number,armorClass:number):D20Outcome & {hit:boolean} {
 if(!Number.isInteger(die)||die<1||die>20||!Number.isFinite(modifier)||!Number.isFinite(armorClass))throw new Error('Invalid attack');
 return {die,modifier,total:die+modifier,critical:die===20,automaticMiss:die===1,hit:die===20||(die!==1&&die+modifier>=armorClass)};
}
export function resolveSavingThrow(die:number,modifier:number,difficulty:number):D20Outcome & {success:boolean} {
 if(!Number.isInteger(die)||die<1||die>20||!Number.isFinite(modifier)||!Number.isFinite(difficulty))throw new Error('Invalid save');
 return {die,modifier,total:die+modifier,critical:false,automaticMiss:false,success:die+modifier>=difficulty};
}
export function attackModifier(abilities:Record<Ability,number>,ability:Ability,level:number,proficient:boolean,extra=0):number {
 return abilityModifier(abilities[ability])+ (proficient?proficiencyBonus(level):0)+extra;
}
