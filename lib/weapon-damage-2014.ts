/** Weapon damage preview, D&D 5e 2014. Never applies HP changes. */
export type DamageDice2014={count:number;sides:number;flat:number};
export function parseDamageDice2014(expression:string):DamageDice2014 {
 const text=expression.replace(/\s/g,'').toLowerCase();
 const match=/^(?:(\d+)d(\d+)|([0-9]+))([+-]\d+)?$/.exec(text);
 if(!match)throw new Error('Expression de dégâts invalide');
 const count=match[3]?0:Number(match[1]);const sides=match[3]?0:Number(match[2]);
 const flat=(match[3]?Number(match[3]):0)+Number(match[4]??0);
 if(count>20||sides>100||count<0||(count>0&&sides<2)||Math.abs(flat)>1000)throw new Error('Dés hors limites');
 return {count,sides,flat};
}
export function weaponDamageExpression2014(base:string,versatileTwoHands:boolean):string {
 if(!versatileTwoHands)return base;
 const dice=parseDamageDice2014(base);
 if(dice.count!==1||dice.sides<4||dice.sides>10||dice.sides%2!==0)return base;
 return `1d${dice.sides+2}`;
}
export function damageDiceCount2014(expression:string,critical:boolean):number {
 return parseDamageDice2014(expression).count*(critical?2:1);
}
export function calculateWeaponDamage2014(expression:string,abilityBonus:number,critical:boolean,rolls:number[],extraBonus=0):number {
 const dice=parseDamageDice2014(expression);
 const expected=dice.count*(critical?2:1);
 if(rolls.length!==expected||!rolls.every(n=>Number.isInteger(n)&&n>=1&&n<=dice.sides))throw new Error('Résultats des dés invalides');
 if(!Number.isInteger(abilityBonus)||!Number.isInteger(extraBonus))throw new Error('Bonus invalide');
 return Math.max(0,rolls.reduce((sum,n)=>sum+n,0)+dice.flat+abilityBonus+extraBonus);
}
export function rollWeaponDamage2014(expression:string,abilityBonus:number,critical:boolean,extraBonus=0):{rolls:number[];total:number} {
 const dice=parseDamageDice2014(expression);const rolls=Array.from({length:dice.count*(critical?2:1)},()=>{
  const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);return 1+(bytes[0]%dice.sides);
 });
 return {rolls,total:calculateWeaponDamage2014(expression,abilityBonus,critical,rolls,extraBonus)};
}
