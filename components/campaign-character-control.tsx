'use client';
import dynamic from 'next/dynamic';
import {useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from '@/lib/supabase';
import type {Character} from '@/lib/rules';
import {damageAfterRageResistance2014,type DamageType} from '@/lib/class-effects-2014';
import {equippedArmorClass2014} from '@/lib/armor-class-2014';
import InitiativeScoreForm2014 from '@/components/initiative-score-form-2014';
import CampaignBottomSheet from '@/components/campaign-bottom-sheet';
import CampaignCombatRolls2014 from '@/components/campaign-combat-rolls-2014';

const CharacterSheet=dynamic(()=>import('@/components/character-sheet'),{
 loading:()=> <p role="status">Chargement de la fiche…</p>,
});

type State={campaign_id:string;character_id:string;hp_current:number;hp_max:number;hp_temporary:number;conditions:string[];version:number};
const DAMAGE_TYPES: {value:DamageType;label:string}[]=[{value:'bludgeoning',label:'Contondants'},{value:'piercing',label:'Perforants'},{value:'slashing',label:'Tranchants'},{value:'fire',label:'Feu'},{value:'cold',label:'Froid'},{value:'acid',label:'Acide'},{value:'lightning',label:'Foudre'},{value:'thunder',label:'Tonnerre'},{value:'poison',label:'Poison'},{value:'necrotic',label:'Nécrotiques'},{value:'radiant',label:'Radiants'},{value:'psychic',label:'Psychiques'},{value:'force',label:'Force'}];
const CONDITIONS=['Aveuglé','Charmé','Assourdi','Effrayé','Agrippé','Incapable d’agir','Invisible','Paralysé','Pétrifié','Empoisonné','À terre','Entravé','Étourdi','Inconscient','Épuisement'];
export default function CampaignCharacterControl({campaignId,character,canEdit,me,isGM=false,initiative,onRemove,onEditScore,onAddInitiative,damageTargets}:{campaignId:string;character:Character;canEdit:boolean;me:string;isGM?:boolean;initiative?:{rank?:number;score?:number;active?:boolean;outOfSession?:boolean};onAddInitiative?:()=>void;onRemove?:()=>Promise<boolean>;onEditScore?:(score:number)=>Promise<boolean>;damageTargets?:Character[]}){
 const fullSheetDialog=useRef<HTMLDialogElement>(null);
 const [fullSheetOpen,setFullSheetOpen]=useState(false);
 const rollsDialog=useRef<HTMLDialogElement>(null);
 const dialogRef=useRef<HTMLDialogElement>(null);
 const [allowedNow,setAllowedNow]=useState(false);
 const [state,setState]=useState<State|null>(null),[amount,setAmount]=useState(1),[condition,setCondition]=useState('Empoisonné'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[damageType,setDamageType]=useState<DamageType>('slashing');
 const load=useCallback(async()=>{const s=supabase();const {data,error}=await s.from('campaign_character_state').select('*').eq('campaign_id',campaignId).eq('character_id',character.id).maybeSingle();if(error)setError(error.message);else setState(data)},[campaignId,character.id]);
 useEffect(()=>{
  const check=async()=>{
   const db=supabase();
   const [{data:sessions},{data:members},{data:campaign}]=await Promise.all([
    db.from('game_sessions').select('id').eq('campaign_id',campaignId).eq('status','active').limit(1),
    db.from('campaign_members').select('allow_gm_outside_session').eq('campaign_id',campaignId).eq('character_id',character.id).maybeSingle(),
    db.from('campaigns').select('owner_id').eq('id',campaignId).single()
   ]);
   setAllowedNow(Boolean(sessions?.length)||Boolean(campaign?.owner_id===me&&members?.allow_gm_outside_session));
  };
  void check();window.addEventListener('focus',check);
  return()=>window.removeEventListener('focus',check);
 },[campaignId,character.id,me]);
 useEffect(()=>{load();const s=supabase();const channel=s.channel(`sheet-${campaignId}-${character.id}`).on('postgres_changes',{event:'*',schema:'public',table:'campaign_character_state',filter:`campaign_id=eq.${campaignId}`},load).on('postgres_changes',{event:'INSERT',schema:'public',table:'campaign_character_events',filter:`campaign_id=eq.${campaignId}`},load).subscribe();return()=>{void s.removeChannel(channel)}},[campaignId,character.id,load]);
 async function typedDamage(){if(!canEdit||!allowedNow||busy)return;setBusy(true);setError('');const {error}=await supabase().rpc('apply_campaign_typed_damage_2014',{p_campaign:campaignId,p_target:character.id,p_raw:amount,p_damage_type:damageType,p_source:character.id});if(error)setError(error.message);await load();setBusy(false)}
 async function action(type:string,value:number|null=null,detail:string|null=null){if(!canEdit||!allowedNow||busy)return;setBusy(true);setError('');const {error}=await supabase().rpc('apply_campaign_interaction',{p_campaign:campaignId,p_target:character.id,p_action:type,p_amount:value,p_detail:detail,p_source:character.id});if(error)setError(error.message);await load();setBusy(false)}
 const rageActive=character.class_name==='Barbare'&&character.resource_state?.rage_active===true;
 // Preview only; the server determines the authoritative damage.
 const adjustedDamage=damageAfterRageResistance2014(Math.max(0,amount),{className:character.class_name,level:character.level,rageActive,wearingHeavyArmor:false,attackAbility:'FOR',meleeWeaponAttack:false,damageType});
 const hp=state?.hp_current??character.hp_current,max=state?.hp_max??character.hp_max,temporary=state?.hp_temporary??0,conditions=state?.conditions??[];
 const controls=<>{canEdit&&allowedNow&&<><div className="hp-actions">{initiative&&<button type="button" className="btn outline" aria-label="Diminuer la quantité" disabled={amount<=1} onClick={()=>setAmount(value=>Math.max(1,value-1))}>−</button>}<input className="field" aria-label="Quantité" type="number" min="1" max="9999" value={amount} onChange={e=>setAmount(Number(e.target.value))} style={{maxWidth:100}}/>{initiative&&<button type="button" className="btn outline" aria-label="Augmenter la quantité" disabled={amount>=9999} onClick={()=>setAmount(value=>Math.min(9999,value+1))}>+</button>}<select className="field" aria-label="Type de dégâts" value={damageType} onChange={e=>setDamageType(e.target.value as DamageType)}>{DAMAGE_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select><button disabled={busy||!Number.isInteger(amount)||amount<1||amount>9999} className="btn outline" onClick={typedDamage}>− Dégâts ({adjustedDamage})</button><button disabled={busy||!Number.isInteger(amount)||amount<1||amount>9999} className="btn outline" onClick={()=>action('heal',amount)}>+ Soins</button><button disabled={busy||!Number.isInteger(amount)||amount<1||amount>9999} className="btn outline" onClick={()=>action('temporary_hp',amount)}>PV temporaires</button></div>{rageActive&&<p className="hint">Rage active : résistance automatique aux dégâts contondants, perforants et tranchants (arrondi inférieur). Vérifier l'état de Rage sur la fiche avant d'appliquer les dégâts.</p>}<div className="hp-actions"><select className="field" aria-label="Condition" value={condition} onChange={e=>setCondition(e.target.value)}>{CONDITIONS.map(c=><option key={c}>{c}</option>)}</select><button disabled={busy} className="btn outline" onClick={()=>action('condition_add',null,condition)}>Ajouter</button><button disabled={busy} className="btn outline" onClick={()=>action('condition_remove',null,condition)}>Retirer</button></div></>}{canEdit&&!allowedNow&&<p className="hint">Fiche verrouillée hors séance. Le MJ doit disposer de l'autorisation du joueur.</p>}{error&&<p className="notice error" role="alert">{error}</p>}</>;
 if(initiative) return <>
  <div className="mj-combatant-row">
  <button type="button" className="mj-combatant" aria-current={initiative.active?'step':undefined}
    aria-label={`${allowedNow&&canEdit?'Modifier les PV et états de':'Voir le résumé de'} ${character.name}`}
    onClick={()=>dialogRef.current?.showModal()}>
   <span className="mj-combatant-rank">{initiative.rank??'—'}</span>
   <span className="mj-combatant-name"><strong>{character.name}</strong>
    <small>{initiative.outOfSession?character.class_name:initiative.score===undefined?'Sans initiative':`Initiative ${initiative.score}`}{conditions.length?` · ${conditions.join(', ')}`:''}</small>
   </span>
   <span className="mj-combatant-hp"><span>{hp}/{max} PV{temporary>0?` · +${temporary} temp.`:''}</span>
    <span className="mj-hp-track" aria-hidden="true"><span style={{width:`${Math.max(0,Math.min(100,hp/max*100))}%`}}/></span>
   </span>
   <span className="mj-combatant-ac">CA {equippedArmorClass2014(character).total}</span>
  </button>
  <div className="mj-combatant-actions">
   {onAddInitiative&&<button type="button" className="btn outline" aria-haspopup="dialog"
    aria-label={`Jet d’initiative de ${character.name}`} onClick={onAddInitiative}>Jet d’initiative</button>}
   {canEdit&&!initiative.outOfSession&&<button type="button" className="btn outline" aria-label={`Lancer un jet pour ${character.name}`} onClick={()=>rollsDialog.current?.showModal()}>Lancer un jet</button>}
   {allowedNow&&canEdit&&<button type="button" className="btn outline" aria-label={`Modifier les PV de ${character.name}`} onClick={()=>dialogRef.current?.showModal()}>Modifier les PV</button>}
   {(isGM||canEdit)&&<button type="button" className="btn outline" aria-haspopup="dialog"
    aria-label={`Ouvrir la fiche complète de ${character.name}`} onClick={()=>{
     fullSheetDialog.current?.showModal();
     setFullSheetOpen(true);
    }}>Fiche complète</button>}
  </div>
  </div>
  {(isGM||canEdit)&&<CampaignBottomSheet side dialogRef={fullSheetDialog} title={`Fiche complète · ${character.name}`}
   onClose={()=>setFullSheetOpen(false)}>
   {fullSheetOpen&&<CharacterSheet id={character.id} campaignVitals={{hp,max,temporary,conditions}}/>}
  </CampaignBottomSheet>}
  <CampaignBottomSheet centered dialogRef={dialogRef} title={`PV et états · ${character.name}`}>
   <p className="mj-muted">{hp}/{max} PV · {temporary} PV temporaires · CA {equippedArmorClass2014(character).total}</p>
   {conditions.length>0&&<p>{conditions.join(', ')}</p>}
   {onEditScore && initiative.score !== undefined &&
    <InitiativeScoreForm2014 key={initiative.score} score={initiative.score} onSave={onEditScore}/>}
   {controls}
   {canEdit&&initiative.outOfSession&&<details className="mj-disclosure"><summary>Jets de combat</summary>
    <CampaignCombatRolls2014 character={character} campaignId={campaignId} isGM={isGM}/>
   </details>}
   {onRemove&&<button type="button" className="btn outline mj-risk" onClick={async()=>{
    if(window.confirm(`Retirer ${character.name} de l’initiative ?`)&&await onRemove())dialogRef.current?.close();
   }}>Retirer de l’initiative</button>}
  </CampaignBottomSheet>
  {canEdit&&!initiative.outOfSession&&<CampaignBottomSheet centered dialogRef={rollsDialog} title={`Jets · ${character.name}`}>
   <CampaignCombatRolls2014 character={character} campaignId={campaignId} isGM={isGM} damageTargets={damageTargets}/>
  </CampaignBottomSheet>}
 </>;
 return <><section className="panel campaign-sheet"><h3>{character.name} <small>· {character.class_name} niveau {character.level}</small></h3><p className="hint">CA d’équipement : {equippedArmorClass2014(character).total}</p><div className="hp"><strong>{hp}</strong><span>/ {max} PV · {temporary} temporaires</span></div><div className="hp-track"><div style={{width:`${Math.max(0,Math.min(100,hp/max*100))}%`}}/></div>{conditions.length>0&&<p className="hint">Conditions : {conditions.join(', ')}</p>}{controls}</section><details className="panel campaign-disclosure"><summary>Jets de combat</summary><CampaignCombatRolls2014 character={character} campaignId={campaignId} isGM={isGM}/></details></>
}
