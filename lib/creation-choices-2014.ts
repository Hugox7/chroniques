/** Sélections de niveau 1 (D&D 5e 2014). Les noms de sorts restent libres jusqu'à l'intégration d'un catalogue complet et licencié. */
/** Normalisation des saisies libres : accents, casse et espaces ne créent pas de faux sorts distincts. */
export function normalizeSpellName2014(value:string):string {
 return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('fr');
}
export function uniqueNonemptySpellNames2014(values:string[], expected:number):boolean {
 return Number.isInteger(expected) && expected>=0 && values.length===expected && values.every(v=>typeof v==='string' && normalizeSpellName2014(v).length>0)
  && new Set(values.map(normalizeSpellName2014)).size===expected;
}

export const spellChoicesLevelOne2014:Record<string,{cantrips:number;levelOne:number}>={
 'Barde':{cantrips:2,levelOne:4},'Clerc':{cantrips:3,levelOne:0},'Druide':{cantrips:2,levelOne:0},
 'Ensorceleur':{cantrips:4,levelOne:2},'Occultiste':{cantrips:2,levelOne:2},'Magicien':{cantrips:3,levelOne:6}
};
export function validSpellChoicesLevelOne2014(cls:string,cantrips:string[],spells:string[]){
 const r=spellChoicesLevelOne2014[cls];if(!r)return cantrips.length===0 && spells.length===0;
 return uniqueNonemptySpellNames2014(cantrips,r.cantrips)&&uniqueNonemptySpellNames2014(spells,r.levelOne);
}
export const rangerEnemies2014=['Aberrations','Bêtes','Célestes','Créatures artificielles','Dragons','Élémentaires','Fées','Fiélons','Géants','Humanoïdes (deux peuples)','Morts-vivants','Monstruosités','Plantes','Vases'];
export const rangerTerrains2014=['Arctique','Côte','Désert','Forêt','Marais','Montagne','Outreterre','Plaine'];

/** Nombre de sorts préparables au niveau 1, hors sorts de domaine. */
export function preparedSpellCountLevelOne2014(cls:string, wisdomScore:number, intelligenceScore:number):number|null {
 const ability = cls==='Magicien'?intelligenceScore:(cls==='Clerc'||cls==='Druide'?wisdomScore:null);
 if(ability===null || !Number.isInteger(ability) || ability<1 || ability>30)return null;
 return Math.max(1,1+Math.floor((ability-10)/2));
}

/** La préparation du magicien est un sous-ensemble des six sorts du grimoire. */
export function validWizardPreparationLevelOne2014(known:string[],prepared:string[],intelligenceScore:number):boolean {
 const expected=preparedSpellCountLevelOne2014('Magicien',10,intelligenceScore);
 if(expected===null||expected>6||known.length!==6||prepared.length!==expected)return false;
 if(!uniqueNonemptySpellNames2014(known,6)||!uniqueNonemptySpellNames2014(prepared,expected))return false;
 const available=new Set(known.map(normalizeSpellName2014));
 return prepared.map(normalizeSpellName2014).every(value=>available.has(value));
}

/** Vérifie le nombre et l'unicité des sorts préparés du Clerc et du Druide (noms libres). */
export function validDivinePreparationLevelOne2014(cls:string, prepared:string[], wisdomScore:number):boolean {
 if(cls!=='Clerc'&&cls!=='Druide')return true;
 const expected=preparedSpellCountLevelOne2014(cls,wisdomScore,10);
 if(expected===null||prepared.length!==expected)return false;
 return uniqueNonemptySpellNames2014(prepared,expected);
}

/** Vérification des options de classe choisies au niveau 1, indépendante de l'interface. */
export function validClassChoicesLevelOne2014(cls:string, choice:{fightingStyle?:string; subclass?:string; favoredEnemy?:string; favoredTerrain?:string}):boolean {
 if(cls==='Guerrier')return ['Archerie','Défense','Duel','Combat à deux armes','Combat avec armes à deux mains','Protection'].includes(choice.fightingStyle??'');
 if(cls==='Ensorceleur')return ['Lignée draconique','Magie sauvage'].includes(choice.subclass??'');
 if(cls==='Occultiste')return ['Archifée','Fiélon','Grand Ancien'].includes(choice.subclass??'');
 if(cls==='Rôdeur')return rangerEnemies2014.includes(choice.favoredEnemy??'')&&rangerTerrains2014.includes(choice.favoredTerrain??'');
 return true;
}

/** Résultat structuré pour guider le joueur sans valider une fiche incomplète. */
export type CreationIssue2014 = { code:string; message:string };
export function auditSpellChoicesLevelOne2014(input:{cls:string;cantrips:string[];spells:string[];prepared:string[];wisdom:number;intelligence:number}):CreationIssue2014[]{
 const issues:CreationIssue2014[]=[];
 const rule=spellChoicesLevelOne2014[input.cls];
 if(!rule){
  if(input.cantrips.length||input.spells.length||input.prepared.length)issues.push({code:'unexpected_spells',message:'Cette classe ne choisit pas de sorts au niveau 1.'});
  return issues;
 }
 if(!uniqueNonemptySpellNames2014(input.cantrips,rule.cantrips))issues.push({code:'cantrips',message:`Choisissez ${rule.cantrips} sorts mineurs distincts.`});
 if(!uniqueNonemptySpellNames2014(input.spells,rule.levelOne))issues.push({code:'known_spells',message:`Choisissez ${rule.levelOne} sorts de niveau 1 distincts.`});
 if(input.cls==='Magicien'){
  if(!validWizardPreparationLevelOne2014(input.spells,input.prepared,input.intelligence))issues.push({code:'wizard_preparation',message:'Les sorts préparés doivent appartenir au grimoire et respecter la limite.'});
 }else if(input.cls==='Clerc'||input.cls==='Druide'){
  if(!validDivinePreparationLevelOne2014(input.cls,input.prepared,input.wisdom))issues.push({code:'divine_preparation',message:'Le nombre de sorts préparés doit correspondre à la Sagesse.'});
 }else if(input.prepared.length){
  issues.push({code:'unexpected_preparation',message:'Cette classe ne prépare pas de sorts au niveau 1.'});
 }
 return issues;
}
