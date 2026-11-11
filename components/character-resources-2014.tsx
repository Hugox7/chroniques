'use client';
import {useState} from 'react';
import type {Character} from '@/lib/rules';
import {spellSlots2014} from '@/lib/progression-2014';
import {normalizedResources2014,recoverResources2014,resourceDefinitions2014} from '@/lib/resources-2014';
import {rageBonus2014,spendKi2014,type KiTechnique} from '@/lib/class-effects-2014';
type Props={character:Character;onSave:(changes:Partial<Character>)=>Promise<void>};
export default function CharacterResources2014({character:c,onSave}:Props){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const state=normalizedResources2014(c),maxSlots=spellSlots2014(c.class_name,c.level),definitions=resourceDefinitions2014(c);
 async function persist(next:NonNullable<Character['resource_state']>){if(busy)return;setBusy(true);setError('');try{await onSave({resource_state:next})}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 function changeSlot(i:number,delta:number){const next=[...(state.slots??[])];next[i]=Math.max(0,Math.min(maxSlots[i],next[i]+delta));void persist({...state,slots:next})}
 function changeFeature(key:string,delta:number,max:number){const next={...state.features};next[key]=Math.max(0,Math.min(max,(next[key]??max)+delta));void persist({...state,features:next})}
 function toggleRage(){
  if(c.class_name!=='Barbare')return;
  if(state.rage_active){void persist({...state,rage_active:false});return}
  const remaining=state.features?.rage??0;
  if(remaining<=0){setError('Aucune utilisation de Rage disponible.');return}
  void persist({...state,features:{...state.features,rage:remaining-1},rage_active:true});
 }
 function useKi(technique:KiTechnique){
  if(c.class_name!=='Moine')return;
  const current=state.features?.ki??0;
  const result=spendKi2014(current,c.level,technique);
  if(!result.spent){setError(result.reason??'Technique indisponible');return}
  void persist({...state,features:{...state.features,ki:result.remaining}});
 }
 async function rest(kind:'short'|'long'){
  const label=kind==='short'?'repos court':'repos long';
  if(!confirm(`Effectuer un ${label} et récupérer les ressources correspondantes ? Les PV et dés de vie ne sont pas modifiés automatiquement.`))return;
  await persist(recoverResources2014(c,kind));
 }
 if(!maxSlots.some(Boolean)&&definitions.length===0)return null;
 return <div className="panel full"><h2>Ressources et magie · D&D 5e 2014</h2>
 <p className="hint">Compteurs de ressources consommables pour personnage monoclassé. Les sorts restent libres dans la fiche. Les règles de sous-classe, les dons et les cas particuliers ne sont pas automatisés.</p>
 {maxSlots.some(Boolean)&&<><h3>Emplacements de sorts</h3><div className="mechanics-grid">{maxSlots.map((max,i)=>max>0?<div className="mechanic-row" key={i}><span>Niveau {i+1} {c.class_name==='Occultiste'?'· Pacte':''}</span><span style={{display:'flex',alignItems:'center',gap:10}}><button type="button" className="btn outline" disabled={busy||(state.slots?.[i]??0)<=0} onClick={()=>changeSlot(i,-1)} aria-label={`Dépenser un emplacement de niveau ${i+1}`}>−</button><strong>{state.slots?.[i]??max} / {max}</strong><button type="button" className="btn outline" disabled={busy||(state.slots?.[i]??max)>=max} onClick={()=>changeSlot(i,1)} aria-label={`Récupérer un emplacement de niveau ${i+1}`}>+</button></span></div>:null)}</div></>}
 {c.class_name==='Barbare'&&<section className="mechanic-row" aria-label="Rage du Barbare"><div><strong>Rage : {state.rage_active?'active':'inactive'}</strong><p className="hint">Bonus de dégâts de mêlée avec la Force : +{rageBonus2014(c.level)} ; résistance aux dégâts contondants, perforants et tranchants pendant la Rage. Les conditions de maintien et la durée restent à gérer en partie.</p></div><button type="button" className="btn outline" disabled={busy||(!state.rage_active&&(state.features?.rage??0)<=0)} onClick={toggleRage}>{state.rage_active?'Terminer la Rage':'Activer la Rage (1 utilisation)'}</button></section>}
 {c.class_name==='Moine'&&c.level>=2&&<section aria-label="Techniques de Ki"><h3>Techniques de Ki</h3><div className="mechanics-grid">{([['flurry-of-blows','Déluge de coups'],['patient-defense','Défense patiente'],['step-of-the-wind','Pas du vent'],...(c.level>=5?[['stunning-strike','Frappe étourdissante']]:[])] as [KiTechnique,string][]).map(([key,name])=><div className="mechanic-row" key={key}><span>{name} · 1 point de Ki</span><button type="button" className="btn outline" disabled={busy||(state.features?.ki??0)<1} onClick={()=>useKi(key)}>Utiliser</button></div>)}</div><p className="hint">Ces boutons consomment les points de Ki ; les jets, effets et l'économie d'actions restent à résoudre en jeu.</p></section>}
 {definitions.length>0&&<><h3>Capacités de classe</h3><div className="mechanics-grid">{definitions.map(d=><div className="mechanic-row" key={d.key}><span>{d.name} <small>({d.recovery==='short'?'repos court':'repos long'})</small>{d.description&&<small> · {d.description}</small>}</span><span style={{display:'flex',alignItems:'center',gap:10}}><button type="button" className="btn outline" disabled={busy||(state.features?.[d.key]??0)<=0} onClick={()=>changeFeature(d.key,-1,d.maximum)}>−</button><strong>{state.features?.[d.key]??d.maximum} / {d.maximum}</strong><button type="button" className="btn outline" disabled={busy||(state.features?.[d.key]??d.maximum)>=d.maximum} onClick={()=>changeFeature(d.key,1,d.maximum)}>+</button></span></div>)}</div></>}
 <div className="hp-actions"><button className="btn outline" type="button" disabled={busy} onClick={()=>void rest('short')}>Repos court · récupérer</button><button className="btn outline" type="button" disabled={busy} onClick={()=>void rest('long')}>Repos long · récupérer</button></div>
 <p className="hint">Les repos ne modifient pas automatiquement les PV, les dés de vie ou les ressources conditionnelles. Un repos court ne restaure les emplacements que pour l'occultiste. Les compteurs sont conservés en base.</p>
 {error&&<p role="alert" className="notice error">{error}</p>}</div>
}
