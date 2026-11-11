/** Optional class damage bonuses for SRD 5.1 (2014). No automatic HP changes. */
export function rageWeaponBonus2014(input:{className:string;level:number;active:boolean;heavyArmor:boolean;ability:string;melee:boolean}):number {
 if(input.className!=='Barbare'||input.level<1||!input.active||input.heavyArmor||input.ability!=='FOR'||!input.melee)return 0;
 return input.level>=16?4:input.level>=9?3:2;
}
export function sneakAttackDice2014(level:number):number {
 if(!Number.isInteger(level)||level<1||level>20)throw new RangeError('Niveau invalide');
 return Math.ceil(level/2);
}
export function sneakAttackEligible2014(input:{className:string;level:number;finesse:boolean;ranged:boolean}):boolean {
 return input.className==='Roublard'&&input.level>=1&&(input.finesse||input.ranged);
}
/** Sneak Attack dice are doubled on a critical hit; bonus applies at most once per turn (caller confirmation). */
export function sneakAttackDamage2014(rolls:number[],level:number,critical:boolean):number {
 const count=sneakAttackDice2014(level)*(critical?2:1);
 if(rolls.length!==count||!rolls.every(n=>Number.isInteger(n)&&n>=1&&n<=6))throw new Error('Dés d’attaque sournoise invalides');
 return rolls.reduce((a,b)=>a+b,0);
}

export function divineSmiteEligible2014(className: string, level: number, meleeWeaponHit: boolean): boolean {
 return className === 'Paladin' && level >= 2 && meleeWeaponHit;
}

export function divineSmiteDice2014(slotLevel: number, fiendOrUndead: boolean, critical: boolean): number {
 if (!Number.isInteger(slotLevel) || slotLevel < 1 || slotLevel > 9) {
  throw new RangeError('Niveau d’emplacement invalide');
 }
 const count = Math.min(5, slotLevel + 1) + Number(fiendOrUndead);
 return critical ? count * 2 : count;
}
