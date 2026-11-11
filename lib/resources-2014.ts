import {type Character,mod} from './rules';
import {spellSlots2014} from './progression-2014';
export type ResourceState={slots?:number[];features?:Record<string,number>;level?:number;class_name?:string;rage_active?:boolean;paladin_slots_corrected?:true;ranger_slots_corrected?:true};
export type ResourceDefinition={key:string;name:string;maximum:number;recovery:'short'|'long';description?:string};
export function resourceDefinitions2014(c:Character):ResourceDefinition[]{
 const l=c.level,cha=Math.max(1,mod(c.abilities.CHA)),wis=Math.max(1,mod(c.abilities.SAG));
 switch(c.class_name){
 case 'Barbare':return [{key:'rage',name:'Rages',maximum:l>=20?999:l>=17?6:l>=12?5:l>=6?4:l>=3?3:2,recovery:'long',description:l>=20?'Illimité en jeu (999 est un compteur indicatif)':''}];
 case 'Barde':return [{key:'inspiration',name:'Inspirations bardiques',maximum:cha,recovery:l>=5?'short':'long'}];
 case 'Clerc':return l>=2?[{key:'channel',name:'Canalisation divine',maximum:l>=18?3:l>=6?2:1,recovery:'short'}]:[];
 case 'Druide':return l>=2?[{key:'wildshape',name:'Formes sauvages',maximum:l>=20?999:2,recovery:'short',description:l>=20?'Illimité en jeu':''}]:[];
 case 'Guerrier':return [{key:'secondwind',name:'Second souffle',maximum:1,recovery:'short'},...(l>=2?[{key:'actionsurge',name:'Sursaut d’activité',maximum:l>=17?2:1,recovery:'short' as const}]:[]),...(l>=9?[{key:'indomitable',name:'Indomptable',maximum:l>=17?3:l>=13?2:1,recovery:'long' as const}]:[])];
 case 'Moine':return l>=2?[{key:'ki',name:'Points de ki',maximum:l,recovery:'short'}]:[];
 case 'Paladin':return [{key:'layhands',name:'Imposition des mains (PV)',maximum:l*5,recovery:'long'},...(l>=3?[{key:'channel',name:'Canalisation divine',maximum:1,recovery:'short' as const}]:[])];
 case 'Rôdeur':return [];
 case 'Roublard':return [];
 case 'Ensorceleur':return l>=2?[{key:'sorcery',name:'Points de sorcellerie',maximum:l,recovery:'long'}]:[];
 case 'Occultiste':return [];
 case 'Magicien':return [{key:'arcane-recovery',name:'Récupération arcanique (utilisations)',maximum:1,recovery:'long',description:'Une fois par jour après un repos court ; choisissez manuellement les emplacements récupérés (niveaux cumulés ≤ moitié du niveau de magicien, arrondie au supérieur, aucun niveau 6+).'}];
 default:return [];
 }
}
export function normalizedResources2014(c:Character):ResourceState{
 const old:ResourceState=c.resource_state??{};
 const slots=spellSlots2014(c.class_name,c.level);
 const defs=resourceDefinitions2014(c);
 const sameClass=old.class_name===c.class_name;
 // A level increase never refills resources already spent. New spell slots start available.
 const oldLevel=old.level??c.level;
 // Unmarked half-caster counters used the table that rounded odd levels down.
 const legacyHalfCaster=(c.class_name==='Paladin'&&!old.paladin_slots_corrected)
  ||(c.class_name==='Rôdeur'&&!old.ranger_slots_corrected);
 const oldSlotLevel=legacyHalfCaster?oldLevel-(oldLevel%2):oldLevel;
 const priorMax=sameClass?spellSlots2014(c.class_name,oldSlotLevel):slots;
 const currentSlots=slots.map((maximum,i)=>sameClass&&old.slots?.[i]!==undefined?Math.max(0,Math.min(maximum,old.slots[i]+Math.max(0,maximum-(priorMax[i]??0)))):maximum);
 const features:Record<string,number>={};
 const oldDefs=sameClass&&old.level&&old.level!==c.level?resourceDefinitions2014({...c,level:old.level}):defs;
 for(const d of defs){
  const previous=oldDefs.find(x=>x.key===d.key)?.maximum??0;
  features[d.key]=sameClass&&old.features?.[d.key]!==undefined?Math.max(0,Math.min(d.maximum,old.features[d.key]+Math.max(0,d.maximum-previous))):d.maximum;
 }
 return {slots:currentSlots,features,level:c.level,class_name:c.class_name,rage_active:sameClass&&old.rage_active===true&&features.rage!==undefined,
  ...(c.class_name==='Paladin'?{paladin_slots_corrected:true}:{}),
  ...(c.class_name==='Rôdeur'?{ranger_slots_corrected:true}:{})};
}
export function recoverResources2014(c:Character,kind:'short'|'long'):ResourceState{
 const state=normalizedResources2014(c),slots=spellSlots2014(c.class_name,c.level);
 const defs=resourceDefinitions2014(c);
 const features={...state.features};
 for(const d of defs)if(kind==='long'||d.recovery==='short')features[d.key]=d.maximum;
 // Pact Magic recovers on short rest; standard spellcasting slots on long rest.
 const recoverSlots=kind==='long'||c.class_name==='Occultiste';
 return {...state,slots:recoverSlots?[...slots]:state.slots,features,rage_active:false};
}
