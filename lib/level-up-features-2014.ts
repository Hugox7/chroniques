/** SRD 5.1 class-feature reminders. Subclass entries are only applied when selected. */
import {getClassFeaturesAtLevel2014} from './ruleset-2014-progression';

export const classIds2014: Record<string,string> = {
  Barbare:'barbarian', Barde:'bard', Clerc:'cleric', Druide:'druid', Guerrier:'fighter',
  Moine:'monk', Paladin:'paladin', 'Rôdeur':'ranger', Roublard:'rogue',
  Ensorceleur:'sorcerer', Occultiste:'warlock', Magicien:'wizard'
};

export const srdSubclass2014: Record<string,{id:string;label:string;aliases:string[]}> = {
  Barbare:{id:'berserker',label:'Voie du berserker',aliases:['berserker','path of the berserker']},
  Barde:{id:'lore',label:'Collège du savoir',aliases:['lore','college of lore']},
  Clerc:{id:'life',label:'Domaine de la Vie',aliases:['life','life domain']},
  Druide:{id:'land',label:'Cercle de la Terre',aliases:['land','circle of the land']},
  Guerrier:{id:'champion',label:'Champion',aliases:['champion']},
  Moine:{id:'open-hand',label:'Voie de la main ouverte',aliases:['open hand','way of the open hand']},
  Paladin:{id:'devotion',label:'Serment de dévotion',aliases:['devotion','oath of devotion']},
  'Rôdeur':{id:'hunter',label:'Chasseur',aliases:['hunter']},
  Roublard:{id:'thief',label:'Voleur',aliases:['thief']},
  Ensorceleur:{id:'draconic',label:'Lignée draconique',aliases:['draconic','draconic bloodline']},
  Occultiste:{id:'fiend',label:'Fiélon',aliases:['fiend','the fiend']},
  Magicien:{id:'evocation',label:'École d’évocation',aliases:['evocation','school of evocation']}
};

const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function selectedSrdSubclassId2014(className:string,subclass?:string,clericDomain?:string):string|null {
  const choice=(className==='Clerc' ? (clericDomain||subclass) : subclass)||'';
  const item=srdSubclass2014[className];
  if(!item||!choice.trim())return null;
  return [item.id,item.label,...item.aliases].some(label=>normalize(label)===normalize(choice))?item.id:null;
}

export function earnedFeatureReminders2014(className:string,level:number,subclass?:string,clericDomain?:string):string[] {
  const classId=classIds2014[className];
  if(!classId)return [];
  const selected=selectedSrdSubclassId2014(className,subclass,clericDomain);
  return getClassFeaturesAtLevel2014(classId,level)
    .filter(feature=>!feature.subclass||feature.subclass===selected)
    .map(feature=>`[Niveau ${level}] ${feature.name}`);
}
