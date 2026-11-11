'use client';
import {useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import type {CombatTarget2014} from './combat-target-picker-2014';
import {equippedArmorClass2014} from '@/lib/armor-class-2014';
import {supabase} from '@/lib/supabase';
import type {Character,Ability} from '@/lib/rules';
import {abilityModifier,attackModifier,chooseD20,proficiencyBonus,resolveAttack,resolveSavingThrow,type RollMode} from '@/lib/combat-rolls-2014';
import {characterSavingThrowProficiency2014} from '@/lib/combat-proficiencies-2014';
import {inventoryWeapons2014,weaponAbility2014,weaponProficiency2014} from '@/lib/weapon-attacks-2014';
import {calculateWeaponDamage2014,damageDiceCount2014,rollWeaponDamage2014,weaponDamageExpression2014} from '@/lib/weapon-damage-2014';
import {rageWeaponBonus2014,sneakAttackDice2014,sneakAttackEligible2014,sneakAttackDamage2014,divineSmiteEligible2014,divineSmiteDice2014} from '@/lib/class-weapon-damage-2014';
import {normalizedResources2014} from '@/lib/resources-2014';
const CombatTargetPicker2014=dynamic(()=>import('./combat-target-picker-2014'),{
 loading:()=> <p className="hint">Chargement du bestiaire…</p>,
});
type DamagePart = {id:'weapon'|'smite';amount:number;type:string};
const ABILITIES:Ability[]=['FOR','DEX','CON','INT','SAG','CHA'];
function d20(){const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);return 1+(bytes[0]%20)}
export default function CampaignCombatRolls2014({character,campaignId,isGM=false,damageTargets}:{character:Character;campaignId:string;isGM?:boolean;damageTargets?:Character[]}){
 const [kind,setKind]=useState<'attack'|'save'>('attack');
 const [weaponId,setWeaponId]=useState('');
 const [thrown,setThrown]=useState(false);
 const [smiteSlot,setSmiteSlot]=useState(0);
 const [smiteTarget,setSmiteTarget]=useState(false);
 const [smiteManual,setSmiteManual]=useState('');
 const [twoHands,setTwoHands]=useState(false);
 const [damageManual,setDamageManual]=useState('');
 const [useSneak,setUseSneak]=useState(false);
 const [sneakManual,setSneakManual]=useState('');
 const [heavyArmor,setHeavyArmor]=useState(false);
 const [damageExtra,setDamageExtra]=useState(0);
 const [damageResult,setDamageResult]=useState('');
 const [damageParts,setDamageParts]=useState<DamagePart[]>([]);
 const [appliedParts,setAppliedParts]=useState<DamagePart['id'][]>([]);
 const [applying,setApplying]=useState(false);
 const [applyMessage,setApplyMessage]=useState('');
 const applyLock=useRef(false);
 const [lastAttackHit,setLastAttackHit]=useState(false);
 const [lastAttackCritical,setLastAttackCritical]=useState(false);
 const [ability,setAbility]=useState<Ability>('FOR');
 const [attackProficient,setAttackProficient]=useState(false);
 const [saveOverride,setSaveOverride]=useState<boolean|null>(null);
 const [extra,setExtra]=useState(0);
 const [attackCA,setAttackCA]=useState(15);
 const [savingDC,setSavingDC]=useState(15);
 const [chosenTarget,setChosenTarget]=useState<CombatTarget2014|null>(null);
 const [targetCharacterId,setTargetCharacterId]=useState('');
 const targetCharacter=isGM?damageTargets?.find(item=>item.id===targetCharacterId):undefined;
 const [targetPickerOpen,setTargetPickerOpen]=useState(false);
 const combatTarget=isGM?chosenTarget:null;
 const target=kind==='attack'?attackCA:savingDC;
 const [mode,setMode]=useState<RollMode>('normal');
 const [result,setResult]=useState('');
 const [lastRoll,setLastRoll]=useState<{kind:'attack'|'save';ability:Ability;source:'digital'|'physical';mode:RollMode;first_die:number;second_die:number|null;modifier:number;target:number}|null>(null);
 const [publishing,setPublishing]=useState(false),[publishMessage,setPublishMessage]=useState('');
 const [source,setSource]=useState<'digital'|'physical'>('digital');
 const [manualFirst,setManualFirst]=useState('');
 const [manualSecond,setManualSecond]=useState('');
 const inventoryWeapons=inventoryWeapons2014(character.inventory);
 const selectedWeapon=inventoryWeapons.find(w=>w.inventoryId===weaponId);
 const meleeWeapon=selectedWeapon?.weapon.range==='Melee';
 const canThrow=meleeWeapon&&selectedWeapon.weapon.properties.includes('thrown');
 const isMelee=meleeWeapon&&!(canThrow&&thrown);
 const damageExpression=selectedWeapon?.weapon.damage
  ?weaponDamageExpression2014(selectedWeapon.weapon.damage,isMelee&&twoHands&&selectedWeapon.weapon.properties.includes('versatile'))
  :'';
 const damageCount=damageExpression?damageDiceCount2014(damageExpression,lastAttackCritical):0;
 const damageAbility=abilityModifier(character.abilities[ability]);
 const rageBonus=rageWeaponBonus2014({className:character.class_name,level:character.level,active:character.resource_state?.rage_active===true,heavyArmor,ability,melee:isMelee});
 const sneakEligible=!!selectedWeapon&&sneakAttackEligible2014({className:character.class_name,level:character.level,finesse:selectedWeapon.weapon.properties.includes('finesse'),ranged:selectedWeapon.weapon.range==='Ranged'});
 const sneakDice=sneakEligible?sneakAttackDice2014(character.level)*(lastAttackCritical?2:1):0;
 const smiteEligible=divineSmiteEligible2014(character.class_name,character.level,lastAttackHit&&isMelee);
 const smiteSlots=smiteEligible?(normalizedResources2014(character).slots??[]):[];
 const smiteDice=smiteSlot>0&&smiteSlots[smiteSlot-1]>0
  ?divineSmiteDice2014(smiteSlot,smiteTarget,lastAttackCritical)
  :0;
 const inferredSave=characterSavingThrowProficiency2014(character,ability);
 const proficient=kind==='attack'?attackProficient:(saveOverride??inferredSave??false);
 useEffect(()=>{setSaveOverride(null)},[character.class_name,ability]);
 useEffect(()=>{if(!weaponId)return;const found=inventoryWeapons2014(character.inventory).find(w=>w.inventoryId===weaponId);if(!found){setWeaponId('');return;}setAbility(weaponAbility2014(found.weapon,character.abilities));setAttackProficient(weaponProficiency2014(character,found.weapon)===true)},[weaponId,character.inventory,character.abilities,character.class_name]);
 useEffect(()=>{setLastRoll(null);setLastAttackHit(false);setDamageResult('');setDamageManual('');setUseSneak(false);setSneakManual('');resetSmite()},[kind,ability,attackProficient,saveOverride,extra,target,mode,source,manualFirst,manualSecond,weaponId,thrown,combatTarget]);
 const mod=kind==='attack'?attackModifier(character.abilities,ability,character.level,proficient,extra):abilityModifier(character.abilities[ability])+(proficient?proficiencyBonus(character.level):0)+extra;
 const manualValid=source==='digital'||(manualFirst.trim()!==''&&Number.isInteger(Number(manualFirst))&&Number(manualFirst)>=1&&Number(manualFirst)<=20&&(mode==='normal'||(manualSecond.trim()!==''&&Number.isInteger(Number(manualSecond))&&Number(manualSecond)>=1&&Number(manualSecond)<=20)));
 function resetSmite(){
  setSmiteSlot(0);
  setSmiteTarget(combatTarget?.fiendOrUndead??false);
  setSmiteManual('');
 }
 async function applyDamage(part:DamagePart){
  if(!targetCharacter||applyLock.current||appliedParts.includes(part.id)||!damageResult)return;
  if(!window.confirm(`Appliquer ${part.amount} dégâts (${part.type}) à ${targetCharacter.name} ?`))return;
  applyLock.current=true;
  setApplying(true);
  setApplyMessage('');
  try {
   const {error}=await supabase().rpc('apply_campaign_typed_damage_2014',{
    p_campaign:campaignId,p_target:targetCharacter.id,p_raw:part.amount,p_damage_type:part.type,p_source:character.id
   });
   if(error){setApplyMessage(error.message);return;}
   setAppliedParts(previous=>[...previous,part.id]);
   setApplyMessage(`Dégâts enregistrés pour ${targetCharacter.name}. Le journal indique les PV réellement perdus.`);
  } catch {
   setApplyMessage('Impossible de vérifier l’enregistrement. Consulte le journal avant de réessayer.');
  } finally {
   applyLock.current=false;
   setApplying(false);
  }
 }
 function roll(){
  if(!manualValid||applyLock.current)return;
  setAppliedParts([]);
  setApplyMessage('');
  setPublishMessage('');
  setDamageManual('');
  setUseSneak(false);
  setSneakManual('');
  resetSmite();
  const first=source==='digital'?d20():Number(manualFirst),second=mode==='normal'?first:source==='digital'?d20():Number(manualSecond),die=chooseD20(first,second,mode);
  setLastRoll({kind,ability,source,mode,first_die:first,second_die:mode==='normal'?null:second,modifier:mod,target});
  const origin=source==='physical'?'[Dés physiques] ':'[Jet numérique] ';
  const suffix=mode==='normal'?'':` (${first}, ${second} — ${mode==='advantage'?'avantage':'désavantage'})`;
  if(kind==='attack'){
   const r=resolveAttack(die,mod,target);
   setLastAttackHit(r.hit);setLastAttackCritical(r.critical);setDamageResult('');
   setResult(`${origin}Attaque : ${die}${suffix} ${mod>=0?'+':'−'} ${Math.abs(mod)} = ${r.total} contre CA ${target}${combatTarget?` (${combatTarget.name})`:''} — ${r.critical?'Coup critique !':r.automaticMiss?'Échec automatique':r.hit?'Touché':'Raté'}`);
  }else{
   setLastAttackHit(false);setLastAttackCritical(false);
   const r=resolveSavingThrow(die,mod,target);
   setResult(`${origin}Sauvegarde ${ability} : ${die}${suffix} ${mod>=0?'+':'−'} ${Math.abs(mod)} = ${r.total} contre DD ${target} — ${r.success?'Réussite':'Échec'}`);
  }
 }
 async function publish(){
  if(!lastRoll||publishing)return;
  setPublishing(true);setPublishMessage('');
  const {error}=await supabase().from('campaign_combat_rolls_2014').insert({...lastRoll,campaign_id:campaignId,character_id:character.id});
  setPublishMessage(error?`Publication impossible : ${error.message}`:'Jet publié dans le journal partagé.');
  if(!error)setLastRoll(null);
  setPublishing(false);
 }
 function calculateDamage(){
  if(!selectedWeapon||!lastAttackHit||!damageExpression||appliedParts.length||applyLock.current)return;
  try {
   const fixedBonus=damageExtra+rageBonus;
   const result=source==='digital'?rollWeaponDamage2014(damageExpression,damageAbility,lastAttackCritical,fixedBonus):(()=>{
    const rolls=damageManual.split(/[,;\s]+/).filter(Boolean).map(Number);
    return {rolls,total:calculateWeaponDamage2014(damageExpression,damageAbility,lastAttackCritical,rolls,fixedBonus)};
   })();
   let sneak=0;
   if(useSneak&&sneakEligible){
    const rolls=source==='digital'?Array.from({length:sneakDice},()=>{const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);return 1+(bytes[0]%6)}):sneakManual.split(/[,;\s]+/).filter(Boolean).map(Number);
    sneak=sneakAttackDamage2014(rolls,character.level,lastAttackCritical);
   }
   const parts:DamagePart[]=[{id:'weapon',amount:result.total+sneak,type:selectedWeapon.weapon.damageType}];
   let radiant = '';
   if(smiteDice){
    const expression = `${smiteDice}d8`;
    const smite = source==='digital'
     ?rollWeaponDamage2014(expression,0,false)
     :{rolls:smiteManual.split(/[,;\s]+/).filter(Boolean).map(Number),total:0};
    if(source==='physical'){
     try {
      smite.total=calculateWeaponDamage2014(expression,0,false,smite.rolls);
     } catch {
      throw new Error(`Saisissez exactement ${smiteDice} résultats de d8, de 1 à 8, pour le Châtiment divin.`);
     }
    }
    parts.push({id:'smite',amount:smite.total,type:'radiant'});
    radiant = ` · Châtiment divin : ${smite.rolls.join(' + ')} = ${smite.total} dégâts radiants`;
   }
   setDamageParts(parts);
   setDamageResult(`${result.rolls.join(' + ')} + ${damageAbility} (caractéristique) + ${damageExtra} (autre) + ${rageBonus} (Rage)${useSneak&&sneakEligible?` + ${sneak} (Attaque sournoise)`:''} = ${result.total+sneak} dégâts ${selectedWeapon.weapon.damageType}${radiant}.`);
  }catch(error){setDamageParts([]);setDamageResult(error instanceof Error?error.message:'Dégâts invalides')}
 }
 return <section className="panel" aria-label="Jets de combat 2014"><fieldset disabled={applying} style={{border:0,padding:0,margin:0,minWidth:0}}><p className="hint">Lance une attaque ou une sauvegarde. Les PV changent uniquement après validation des dégâts.</p>{kind==='attack'&&isGM&&<div>
  <div className="hp-actions">
   {Boolean(damageTargets?.length)&&<label>Cible de la compagnie <select className="field" value={targetCharacterId} onChange={event=>{
    const next=damageTargets?.find(item=>item.id===event.target.value);
    setTargetCharacterId(next?.id??'');
    setChosenTarget(next?{name:next.name,armorClass:equippedArmorClass2014(next).total,fiendOrUndead:false}:null);
    if(next)setAttackCA(equippedArmorClass2014(next).total);
    setTargetPickerOpen(false);
    setResult('');
   }}>
    <option value="">Aucune</option>
    {damageTargets?.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
   </select></label>}
   <button className="btn outline" type="button" aria-expanded={targetPickerOpen} onClick={()=>setTargetPickerOpen(open=>!open)}>
    {targetPickerOpen?'Fermer le choix de cible':'Choisir une cible'}
   </button>
   {combatTarget&&<>
    <span>{combatTarget.name} · CA {attackCA}{combatTarget.hitPoints!==undefined?` · ${combatTarget.hitPoints} PV de référence`:''}</span>
    <button className="btn outline" type="button" onClick={()=>{setTargetCharacterId('');setChosenTarget(null);setResult('')}}>Retirer la cible</button>
   </>}
  </div>
  {targetPickerOpen&&<CombatTargetPicker2014 onSelect={next=>{
   setTargetCharacterId('');setChosenTarget(next);setAttackCA(next.armorClass);setTargetPickerOpen(false);setResult('');
  }}/>}
 </div>}
 {kind==='attack'&&<div className="hp-actions"><label>Arme de l’inventaire <select className="field" value={weaponId} onChange={e=>{setWeaponId(e.target.value);setThrown(false);setTwoHands(false)}}><option value="">Attaque libre / sans arme sélectionnée</option>{inventoryWeapons.map(w=><option key={w.inventoryId} value={w.inventoryId}>{w.inventoryName}</option>)}</select></label>{selectedWeapon&&<span className="hint">{selectedWeapon.weapon.damage} {selectedWeapon.weapon.damageType} · {selectedWeapon.weapon.category==='Martial'?'arme de guerre':'arme courante'} · {weaponProficiency2014(character,selectedWeapon.weapon)===null?'Maîtrise à vérifier':'Maîtrise de classe'}. {damageExpression?'Les dégâts ne sont pas lancés automatiquement.':'Cette arme n’a pas de dégâts de base.'}</span>}
 {canThrow&&<label><input type="checkbox" checked={thrown} onChange={e=>setThrown(e.target.checked)}/> Lancer l’arme (attaque à distance)</label>}
 </div>}<div className="hp-actions"><label>Jet <select className="field" value={kind} onChange={e=>{setKind(e.target.value as 'attack'|'save');setResult('');setLastRoll(null)}}><option value="attack">Attaque</option><option value="save">Sauvegarde</option></select></label><label>Caractéristique <select className="field" value={ability} onChange={e=>setAbility(e.target.value as Ability)}>{ABILITIES.map(a=><option key={a}>{a}</option>)}</select></label><label>{kind==='attack'?'CA cible':'DD'} <input className="field" type="number" min="1" max="40" value={target} onChange={e=>{
  if(kind==='attack')setAttackCA(Number(e.target.value));else setSavingDC(Number(e.target.value));
 }} style={{maxWidth:85}}/></label><label>Mode <select className="field" value={mode} onChange={e=>setMode(e.target.value as RollMode)}><option value="normal">Normal</option><option value="advantage">Avantage</option><option value="disadvantage">Désavantage</option></select></label></div><div className="hp-actions"><label>Origine du jet <select className="field" value={source} onChange={e=>{setSource(e.target.value as 'digital'|'physical');setResult('');setLastRoll(null)}}><option value="digital">Dés numériques</option><option value="physical">Dés physiques (saisie manuelle)</option></select></label>{source==='physical'&&<><label>Résultat du d20 <input aria-label="Résultat du premier d20" className="field" type="number" min="1" max="20" step="1" value={manualFirst} onChange={e=>setManualFirst(e.target.value)} style={{maxWidth:85}}/></label>{mode!=='normal'&&<label>Second d20 <input aria-label="Résultat du second d20" className="field" type="number" min="1" max="20" step="1" value={manualSecond} onChange={e=>setManualSecond(e.target.value)} style={{maxWidth:85}}/></label>}</>}</div><div className="hp-actions"><label><input type="checkbox" checked={proficient} onChange={e=>kind==='attack'?setAttackProficient(e.target.checked):setSaveOverride(e.target.checked)}/> Maîtrise (+{proficiencyBonus(character.level)})</label>{kind==='save'&&<span className="hint">{inferredSave===null?'Classe inconnue : maîtrise à vérifier':saveOverride===null?'Maîtrise déduite de la classe (2014)':'Maîtrise modifiée manuellement'}</span>}{kind==='attack'&&<span className="hint">{selectedWeapon?'La maîtrise et la caractéristique sont proposées automatiquement, modifiables si nécessaire.':'Vérifiez la maîtrise de l’arme utilisée.'}</span>}<label>Bonus supplémentaire <input className="field" type="number" min="-20" max="20" value={extra} onChange={e=>setExtra(Number(e.target.value))} style={{maxWidth:80}}/></label><button className="btn outline" disabled={!manualValid||!Number.isInteger(target)||target<1||target>40||!Number.isInteger(extra)||extra< -20||extra>20} onClick={roll}>{source==='physical'?'Calculer le jet':'Lancer le d20'} ({mod>=0?'+':''}{mod})</button></div>{result&&<p role="status" className="notice">{result}</p>}{kind==='attack'&&selectedWeapon&&lastAttackHit&&damageExpression&&<div className="hp-actions"><strong>Dégâts {lastAttackCritical?'critiques':''} : {damageExpression} {lastAttackCritical?'(dés doublés)':''}</strong>{isMelee&&selectedWeapon.weapon.properties.includes('versatile')&&<label><input type="checkbox" checked={twoHands} onChange={e=>{setTwoHands(e.target.checked);setDamageResult('')}}/> À deux mains (polyvalente)</label>}<label>Bonus de dégâts <input className="field" type="number" value={damageExtra} onChange={e=>{setDamageExtra(Number(e.target.value));setDamageResult('')}} style={{maxWidth:75}}/></label>{character.class_name==='Barbare'&&character.resource_state?.rage_active&&<label><input type="checkbox" checked={heavyArmor} onChange={e=>{setHeavyArmor(e.target.checked);setDamageResult('')}}/> Armure lourde portée (désactive le bonus de Rage)</label>}{sneakEligible&&<><label><input type="checkbox" checked={useSneak} onChange={e=>{setUseSneak(e.target.checked);setDamageResult('')}}/> Attaque sournoise (+{sneakDice}d6) — conditions remplies et non utilisée ce tour</label>{useSneak&&source==='physical'&&<label>Résultats des {sneakDice} d6 sournois <input className="field" value={sneakManual} onChange={e=>{setSneakManual(e.target.value);setDamageResult('')}} placeholder="Ex. 3, 5"/></label>}</>}{smiteEligible&&<fieldset>
  <legend>Châtiment divin</legend>
  {smiteSlots.some(n=>n>0)?<>
   <label>Emplacement de sort <select className="field" value={smiteDice?smiteSlot:0} onChange={e=>{
    setSmiteSlot(Number(e.target.value));setSmiteManual('');setDamageResult('');
   }}>
    <option value={0}>Sans châtiment</option>
    {smiteSlots.map((remaining,i)=>remaining>0?<option key={i} value={i+1}>Niveau {i+1} ({remaining} disponible{remaining>1?'s':''})</option>:null)}
   </select></label>
   {smiteDice>0&&<>
    <label><input type="checkbox" checked={smiteTarget} onChange={e=>{
     setSmiteTarget(e.target.checked);setSmiteManual('');setDamageResult('');
    }}/> Cible fiélonne ou morte-vivante</label>
    <p className="hint">+{smiteDice}d8 radiants. Si vous utilisez le châtiment, dépensez l’emplacement dans les ressources de la fiche.</p>
    {source==='physical'&&<label>Résultats des {smiteDice} d8 du Châtiment divin <input className="field" value={smiteManual} onChange={e=>{
     setSmiteManual(e.target.value);setDamageResult('');
    }} placeholder="Ex. 3, 5"/></label>}
   </>}
  </>:<p className="hint">Aucun emplacement de sort disponible.</p>}
 </fieldset>}
 {source==='physical'&&<label>Résultats des {damageCount} dé(s), séparés par des virgules <input className="field" value={damageManual} onChange={e=>{setDamageManual(e.target.value);setDamageResult('')}} placeholder="Ex. 4, 7"/></label>}<button className="btn outline" type="button" disabled={appliedParts.length>0} onClick={calculateDamage}>{source==='physical'?'Calculer les dégâts':'Lancer les dégâts'}</button>{damageResult&&<p role="status" className="notice">{damageResult}</p>}
 {damageResult&&targetCharacter&&damageParts.filter(part=>part.amount>0&&part.amount<=9999).map(part=>
  <button type="button" key={part.id} className="btn gold" disabled={applying||appliedParts.includes(part.id)} onClick={()=>void applyDamage(part)}>
   {appliedParts.includes(part.id)?'Enregistré':`Appliquer ${part.amount} dégâts à ${targetCharacter.name}`} · {part.id==='smite'?'Châtiment divin':selectedWeapon.inventoryName}
  </button>)}
 {applyMessage&&<p role="status">{applyMessage}</p>}</div>}{lastRoll&&<button type="button" className="btn outline" disabled={publishing} onClick={publish}>{publishing?'Publication…':'Partager ce jet avec la campagne'}</button>}{publishMessage&&<p role="status" className="hint">{publishMessage}</p>}</fieldset></section>;
}
