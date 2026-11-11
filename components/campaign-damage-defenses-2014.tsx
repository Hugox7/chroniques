'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import type {Character} from '@/lib/rules';
import type {DamageType} from '@/lib/class-effects-2014';

type Modifier='resistance'|'vulnerability'|'immunity';
type Entry={damage_type:DamageType;modifier:Modifier;source_label:string};
const types: {value:DamageType;label:string}[]=[
 {value:'acid',label:'Acide'},{value:'bludgeoning',label:'Contondants'},
 {value:'cold',label:'Froid'},{value:'fire',label:'Feu'},{value:'force',label:'Force'},
 {value:'lightning',label:'Foudre'},{value:'necrotic',label:'Nécrotiques'},
 {value:'piercing',label:'Perforants'},{value:'poison',label:'Poison'},
 {value:'psychic',label:'Psychiques'},{value:'radiant',label:'Radiants'},
 {value:'slashing',label:'Tranchants'},{value:'thunder',label:'Tonnerre'}
];
const modifiers:{value:Modifier;label:string}[]=[{value:'resistance',label:'Résistance'},{value:'immunity',label:'Immunité'},{value:'vulnerability',label:'Vulnérabilité'}];
export default function CampaignDamageDefenses2014({campaignId,character}:{campaignId:string;character:Character}){
 const [entries,setEntries]=useState<Entry[]>([]),[damageType,setDamageType]=useState<DamageType>('fire');
 const [modifier,setModifier]=useState<Modifier>('resistance'),[source,setSource]=useState('Effet temporaire');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{
  const {data,error}=await supabase().rpc('list_campaign_damage_modifiers_2014',{p_campaign:campaignId,p_character:character.id});
  if(error)setError(error.message);else {setEntries((data??[]) as Entry[]);setError('')}
 },[campaignId,character.id]);
 useEffect(()=>{void load()},[load]);
 async function change(entry:Entry,enabled:boolean){
  if(busy)return;
  setBusy(true);setError('');
  try{
   const {error}=await supabase().rpc('set_campaign_damage_modifier_2014',{
    p_campaign:campaignId,p_character:character.id,p_damage_type:entry.damage_type,
    p_modifier:entry.modifier,p_source_label:entry.source_label,p_enabled:enabled
   });
   if(error)throw error;
   await load();
  }catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
 }
 const automatic:string[]=[];
 if(character.race==='Tieffelin')automatic.push('Résistance au feu (Tieffelin)');
 if(character.race==='Nain')automatic.push('Résistance au poison (Nain)');
 if(character.race==='Halfelin'&&character.subrace==='Costaud')automatic.push('Résistance au poison (Halfelin costaud)');
 if(character.class_name==='Moine'&&character.level>=10)automatic.push('Immunité au poison (Pureté du corps)');
 if(character.class_name==='Barbare'&&character.resource_state?.rage_active)automatic.push('Résistance aux dégâts physiques (Rage active)');
 return <section className="panel" style={{marginTop:12}}>
  <h4>Défenses contre les dégâts · MJ</h4>
  <p className="hint">Les protections ci-dessous sont appliquées par Supabase, sans cumul des résistances. Les protections automatiques ne sont pas modifiables ici.</p>
  {automatic.length>0&&<p className="hint"><strong>Automatiques :</strong> {automatic.join(' · ')}</p>}
  {entries.length===0?<p className="hint">Aucune protection manuelle.</p>:<ul style={{paddingLeft:20}}>{entries.map(e=><li key={`${e.damage_type}-${e.modifier}-${e.source_label}`} style={{marginBottom:8}}>
   {modifiers.find(m=>m.value===e.modifier)?.label} · {types.find(t=>t.value===e.damage_type)?.label} · {e.source_label}{' '}
   <button type="button" className="btn outline" disabled={busy} onClick={()=>void change(e,false)}>Retirer</button>
  </li>)}</ul>}
  <div className="hp-actions" style={{flexWrap:'wrap'}}>
   <select className="field" aria-label="Type de dégâts protégé" value={damageType} onChange={e=>setDamageType(e.target.value as DamageType)}>{types.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select>
   <select className="field" aria-label="Nature de la protection" value={modifier} onChange={e=>setModifier(e.target.value as Modifier)}>{modifiers.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select>
   <input className="field" aria-label="Origine de la protection" maxLength={120} value={source} onChange={e=>setSource(e.target.value)} placeholder="Objet, sort, effet…"/>
   <button type="button" className="btn outline" disabled={busy||!source.trim()} onClick={()=>void change({damage_type:damageType,modifier,source_label:source.trim()},true)}>Ajouter</button>
  </div>
  {error&&<p role="alert" className="notice error">{error}</p>}
 </section>
}
