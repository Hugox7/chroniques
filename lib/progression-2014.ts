/** D&D 5e (2014) SRD 5.1 progression helpers. Single-class characters only. */
import {mod, proficiency, hitDice, type Character} from './rules';

export const subclassLevel: Record<string,number> = {Barbare:3,Barde:3,Clerc:1,Druide:2,Guerrier:3,Moine:3,Paladin:3,'Rôdeur':3,Roublard:3,Ensorceleur:1,Occultiste:1,Magicien:2};
export const asiLevels:Record<string,readonly number[]> = {
  Guerrier:[4,6,8,12,14,16,19],Roublard:[4,8,10,12,16,19],
  ...Object.fromEntries(['Barbare','Barde','Clerc','Druide','Moine','Paladin','Rôdeur','Ensorceleur','Occultiste','Magicien'].map(c=>[c,[4,8,12,16,19]]))
};
export const spellcastingAbility:Record<string,'INT'|'SAG'|'CHA'>={Barde:'CHA',Clerc:'SAG',Druide:'SAG',Paladin:'CHA','Rôdeur':'SAG',Ensorceleur:'CHA',Occultiste:'CHA',Magicien:'INT'};
const fullCasterSlots:number[][]=[
  [2],[3],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],
  [4,3,3,3,2],[4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],
  [4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1],
  [4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1]
];
const pactSlots=[1,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4];
const pactLevel=[1,1,2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5,5];
export function spellSlots2014(cls:string,level:number):number[]{
  if(level<1||level>20)return [];
  if(cls==='Occultiste')return Array.from({length:pactLevel[level-1]},(_,i)=>i===pactLevel[level-1]-1?pactSlots[level-1]:0);
  const half=cls==='Paladin'||cls==='Rôdeur';
  if(!half&&!['Barde','Clerc','Druide','Ensorceleur','Magicien'].includes(cls))return [];
  const casterLevel=half?Math.floor(level/2):level;
  return casterLevel>0?[...fullCasterSlots[casterLevel-1]]:[];
}
export function spellSaveDC(c:Character){const a=spellcastingAbility[c.class_name];return a?8+proficiency(c.level)+mod(c.abilities[a]):null}
export function spellAttackBonus(c:Character){const a=spellcastingAbility[c.class_name];return a?proficiency(c.level)+mod(c.abilities[a]):null}
export function hitPointGain(cls:string,constitution:number,mode:'average'|'roll',rolled?:number){
  const die=hitDice[cls]??8;
  const base=mode==='average'?Math.floor(die/2)+1:Math.max(1,Math.min(die,Math.floor(rolled??1)));
  return Math.max(1,base+mod(constitution));
}
export type LevelUpPlan={nextLevel:number;hpGain:number;requiresSubclass:boolean;offersASI:boolean;proficiencyBonus:number;slots:number[]};
export function planLevelUp(c:Character,hpMode:'average'|'roll',rolled?:number):LevelUpPlan|null{
  if(c.level>=20||c.level<1)return null;
  const nextLevel=c.level+1;
  return {nextLevel,hpGain:hitPointGain(c.class_name,c.abilities.CON,hpMode,rolled),requiresSubclass:nextLevel===subclassLevel[c.class_name]&&!c.subclass,offersASI:asiLevels[c.class_name]?.includes(nextLevel)??false,proficiencyBonus:proficiency(nextLevel),slots:spellSlots2014(c.class_name,nextLevel)};
}
