import spellData from '../data/normalized/spells-2014.json';
import {spellSuggestions2014} from './spell-suggestions-2014';
import {normalizeSpellName2014} from './creation-choices-2014';

/** SRD 5.1 (2014), importé depuis les données remises par l'utilisateur.
 * Les noms anglais font autorité ; les anciens noms français restent acceptés
 * comme alias de saisie sans prétendre être une traduction exhaustive. */
export type SpellLevel2014 = number;
export type SpellEntry2014 = {name:string;level:number;classes:string[];id?:string;school?:string;description?:string;ritual?:boolean;concentration?:boolean};
const classNames:Record<string,string>={Barde:'Bard',Clerc:'Cleric',Druide:'Druid',Ensorceleur:'Sorcerer',Occultiste:'Warlock',Magicien:'Wizard',Paladin:'Paladin',Rôdeur:'Ranger',Guerrier:'Fighter',Roublard:'Rogue',Barbare:'Barbarian',Moine:'Monk'};
const official:SpellEntry2014[]=spellData.map(spell=>({name:spell.name,level:spell.level,classes:spell.classes,id:spell.id,school:spell.school,description:spell.description,ritual:spell.ritual,concentration:spell.concentration}));
const legacy:SpellEntry2014[]=[];
for(const [cls,lists] of Object.entries(spellSuggestions2014)){
 for(const [level,names] of [[0,lists.cantrips],[1,lists.levelOne]] as const){
  for(const name of names){
   const found=legacy.find(e=>e.level===level&&normalizeSpellName2014(e.name)===normalizeSpellName2014(name));
   if(found){if(!found.classes.includes(classNames[cls]))found.classes.push(classNames[cls]);}
   else legacy.push({name,level,classes:[classNames[cls]]});
  }
 }
}
export const spellCatalog2014:SpellEntry2014[]=official;
export const legacySpellAliases2014=legacy;
export function findCatalogSpell2014(name:string,level:SpellLevel2014):SpellEntry2014|undefined{
 const key=normalizeSpellName2014(name);
 return official.find(s=>s.level===level&&normalizeSpellName2014(s.name)===key)||legacy.find(s=>s.level===level&&normalizeSpellName2014(s.name)===key);
}
export function catalogSpellWarnings2014(cls:string,cantrips:string[],levelOne:string[]):string[]{
 const warnings:string[]=[];
 const className=classNames[cls]??cls;
 for(const [level,names] of [[0,cantrips],[1,levelOne]] as const){
  for(const name of names){
   if(!name.trim())continue;
   const exact=findCatalogSpell2014(name,level);
   if(exact&&!exact.classes.includes(className))warnings.push(`« ${name.trim()} » n'est pas répertorié pour ${cls} au niveau ${level} dans notre référentiel. Vérifiez les règles de campagne.`);
   if(!exact){const other=official.find(s=>normalizeSpellName2014(s.name)===normalizeSpellName2014(name));if(other)warnings.push(`« ${name.trim()} » est un sort de niveau ${other.level}, pas de niveau ${level}.`)}
  }
 }
 return [...new Set(warnings)];
}
export function classCatalogSpells2014(cls:string,level:SpellLevel2014):SpellEntry2014[]{
 const className=classNames[cls]??cls;
 return official.filter(s=>s.level===level&&s.classes.includes(className));
}
export function isCatalogChoice2014(cls:string,level:SpellLevel2014,name:string):boolean{
 const found=findCatalogSpell2014(name,level);
 return !found||found.classes.includes(classNames[cls]??cls);
}
