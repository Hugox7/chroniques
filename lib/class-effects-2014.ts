/** Pure 2014 SRD class-effect helpers. No character state is mutated here. */
export type AbilityCode='FOR'|'DEX'|'CON'|'INT'|'SAG'|'CHA';
export type DamageType='acid'|'bludgeoning'|'cold'|'fire'|'force'|'lightning'|'necrotic'|'piercing'|'poison'|'psychic'|'radiant'|'slashing'|'thunder';
export type RageContext={className:string;level:number;rageActive:boolean;wearingHeavyArmor:boolean;attackAbility:AbilityCode;meleeWeaponAttack:boolean;damageType?:DamageType};
export function rageBonus2014(level:number):number{return level>=16?4:level>=9?3:2;}
/** Rage damage bonus only applies to Strength-based melee weapon attacks while raging. */
export function rageDamageBonus2014(c:RageContext):number{
 return c.className==='Barbare'&&c.level>=1&&c.rageActive&&!c.wearingHeavyArmor&&c.attackAbility==='FOR'&&c.meleeWeaponAttack?rageBonus2014(c.level):0;
}
/** Rage grants resistance to bludgeoning, piercing and slashing, even if the attack is magical. */
export function rageResistsDamage2014(c:RageContext):boolean{
 return c.className==='Barbare'&&c.level>=1&&c.rageActive&&['bludgeoning','piercing','slashing'].includes(c.damageType??'');
}
/** Damage is halved, rounded down; resistance is applied only once. */
export function damageAfterRageResistance2014(amount:number,c:RageContext):number{
 if(!Number.isFinite(amount)||amount<0)throw new RangeError('Damage must be a non-negative finite number');
 return rageResistsDamage2014(c)?Math.floor(amount/2):Math.floor(amount);
}
export type KiTechnique='flurry-of-blows'|'patient-defense'|'step-of-the-wind'|'stunning-strike';
export function kiTechniqueCost2014(technique:KiTechnique,monkLevel:number):number|null{
 if(monkLevel<2)return null;
 if(technique==='stunning-strike'&&monkLevel<5)return null;
 return 1;
}
export function spendKi2014(current:number,monkLevel:number,technique:KiTechnique):{remaining:number;spent:boolean;reason?:string}{
 const cost=kiTechniqueCost2014(technique,monkLevel);
 if(cost===null)return {remaining:current,spent:false,reason:'Technique not available at this level'};
 if(!Number.isInteger(current)||current<cost)return {remaining:current,spent:false,reason:'Not enough ki points'};
 return {remaining:current-cost,spent:true};
}
