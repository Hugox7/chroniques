'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {chooseD20,resolveAttack,resolveSavingThrow,type RollMode} from '@/lib/combat-rolls-2014';

type Member={user_id:string;character_id:string|null};
type Character={id:string;name:string};
type Profile={id:string;username:string};
type Event={id:string;session_id:string|null;campaign_id:string;character_id:string;source_character_id:string|null;actor_id:string;action:string;amount:number|null;detail:string|null;created_at:string;undone_event_id:string|null};
type PrivateNote={id:string;body:string;created_at:string};
type SharedRoll={id:string;character_id:string;actor_id:string;kind:'attack'|'save';ability:string;source:'physical'|'digital';mode:RollMode;first_die:number;second_die:number|null;modifier:number;target:number;created_at:string};
const actions:Record<string,string>={damage:'subit des dégâts',heal:'soigne',temporary_hp:'accorde des PV temporaires à',condition_add:'applique une condition à',condition_remove:'retire une condition à',resource_delta:'modifie une ressource de'};
const undoLabels:Record<string,string> = {
 damage:'dégâts', heal:'soins', temporary_hp:'attribution de PV temporaires',
 condition_add:'ajout de l’état', condition_remove:'retrait de l’état',
 resource_delta:'modification d’une ressource',
};
export default function CampaignJournal({campaignId,ownerId,me,members,characters,profiles,compact=false,recentLimit,activeSession,onViewAll}:{campaignId:string;ownerId:string;me:string;members:Member[];characters:Character[];profiles:Profile[];compact?:boolean;recentLimit?:number;activeSession?:{id:string;startedAt:string}|null;onViewAll?:()=>void}){
 const recent = recentLimit !== undefined;
 const [category,setCategory]=useState<'all'|'damage'|'roll'|'note'>('all');
 const [notes,setNotes]=useState<PrivateNote[]>([]);
 const [noteBody,setNoteBody]=useState('');
 const [noteOpen,setNoteOpen]=useState(false);
 const [noteError,setNoteError]=useState('');
 const [savingNote,setSavingNote]=useState(false);
 const noteRequest=useRef(0);
 const noteSaveLock=useRef(false);
 const [rolls,setRolls]=useState<SharedRoll[]>([]);
 const [events,setEvents]=useState<Event[]>([]),[filter,setFilter]=useState('all'),[error,setError]=useState(''),[busy,setBusy]=useState<string|null>(null);
 const [source,setSource]=useState(''),[target,setTarget]=useState(''),[damageType,setDamageType]=useState('slashing'),[kind,setKind]=useState('damage'),[amount,setAmount]=useState(1),[detail,setDetail]=useState(''),[showForm,setShowForm]=useState(false);
 const named=useMemo(()=>members.filter(m=>m.character_id).map(m=>characters.find(c=>c.id===m.character_id)).filter((c):c is Character=>!!c),[members,characters]);
 const canControl=(id:string)=>me===ownerId||members.some(m=>m.user_id===me&&m.character_id===id);
 const load=useCallback(async()=>{const {data,error}=await supabase().from('campaign_character_events').select('id,session_id,campaign_id,character_id,source_character_id,actor_id,action,amount,detail,created_at,undone_event_id').eq('campaign_id',campaignId).order('created_at',{ascending:false}).limit(150);if(error)setError(error.message);else setEvents(data??[])},[campaignId]);
 useEffect(()=>{void load();const s=supabase();const ch=s.channel(`journal-${campaignId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'campaign_character_events',filter:`campaign_id=eq.${campaignId}`},()=>{void load()}).subscribe();return()=>{void s.removeChannel(ch)}},[campaignId,load]);
 const loadRolls=useCallback(async()=>{const {data,error}=await supabase().from('campaign_combat_rolls_2014').select('id,character_id,actor_id,kind,ability,source,mode,first_die,second_die,modifier,target,created_at').eq('campaign_id',campaignId).order('created_at',{ascending:false}).limit(100);if(!error)setRolls((data??[]) as SharedRoll[])},[campaignId]);
 useEffect(()=>{void loadRolls();const db=supabase();const channel=db.channel(`rolls-${campaignId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'campaign_combat_rolls_2014',filter:`campaign_id=eq.${campaignId}`},()=>{void loadRolls()}).subscribe();return()=>{void db.removeChannel(channel)}},[campaignId,loadRolls]);
 const loadNotes=useCallback(async()=>{
  const request=++noteRequest.current;
  const {data,error}=await supabase().from('campaign_private_notes').select('id,body,created_at')
   .eq('campaign_id',campaignId).order('created_at',{ascending:false}).limit(100);
  if(request!==noteRequest.current)return;
  if(error)setNoteError(error.message);
  else setNotes(data??[]);
 },[campaignId]);
 useEffect(()=>{
  setNotes([]);setNoteBody('');setNoteOpen(false);setNoteError('');
  void loadNotes();
  window.addEventListener('focus',loadNotes);
  return ()=>{noteRequest.current++;window.removeEventListener('focus',loadNotes)};
 },[loadNotes,me]);
 async function saveNote(event:React.FormEvent){
  event.preventDefault();
  const body=noteBody.trim();
  if(!body||body.length>2000||noteSaveLock.current)return;
  noteSaveLock.current=true;setSavingNote(true);setNoteError('');
  try{
   const {data,error}=await supabase().from('campaign_private_notes')
    .insert({campaign_id:campaignId,body}).select('id,body,created_at').single();
   if(error){setNoteError(error.message);return}
   noteRequest.current++;
   setNotes(previous=>[data,...previous.filter(note=>note.id!==data.id)].slice(0,100));
   setNoteBody('');setNoteOpen(false);
   if(compact&&!recent)setCategory('note');
   await loadNotes();
  }catch{
   setNoteError('Impossible d’enregistrer la note.');
  }finally{
   noteSaveLock.current=false;setSavingNote(false);
  }
 }
 const renderNote=(note:PrivateNote)=><div key={`note-${note.id}`} className="campaign-private-note">
  <small>Note privée · {new Date(note.created_at).toLocaleString('fr-FR')}</small>
  <p>{note.body}</p>
 </div>;
 const noteFields=<>
  {noteOpen&&<form className="campaign-note-form" onSubmit={saveNote}>
   <label>Ta note <textarea className="field" required maxLength={2000} rows={3}
    value={noteBody} disabled={savingNote} onChange={event=>setNoteBody(event.target.value)}/></label>
   <div className="hp-actions">
    <button className="btn gold" type="submit" disabled={savingNote||!noteBody.trim()}>Enregistrer la note</button>
    {recent&&<button className="btn outline" type="button" disabled={savingNote} onClick={()=>setNoteOpen(false)}>Fermer</button>}
   </div>
  </form>}
  {noteError&&<p className="notice error" role="alert">{noteError}</p>}
 </>;
 const noteForm=<>
  <button className="btn outline" type="button" aria-expanded={noteOpen} disabled={savingNote}
   onClick={()=>setNoteOpen(open=>!open)}>{noteOpen?'Fermer la saisie':'+ Note privée'}</button>
  {noteFields}
 </>;
 const controlledCharacter=named.find(character=>canControl(character.id));
 function toggleActionForm(){
  setShowForm(open=>!open);
  setSource(controlledCharacter?.id||'');
  setTarget(controlledCharacter?.id||'');
 }
 const name=(id:string|null)=>named.find(c=>c.id===id)?.name||'Personnage';
 const user=(id:string)=>profiles.find(p=>p.id===id)?.username||'Participant';
 const undone=new Set(events.filter(e=>e.undone_event_id).map(e=>e.undone_event_id));
 const visible=events.filter(e=>filter==='all'||e.character_id===filter||e.source_character_id===filter);
 async function undo(id:string){if(me!==ownerId)return;if(compact&&!window.confirm('Annuler cette action ?'))return;setBusy(id);setError('');const {error}=await supabase().rpc('undo_campaign_character_event',{p_event:id});if(error)setError(error.message);await load();setBusy(null)}
 async function submit(e:React.FormEvent){e.preventDefault();if(!target||!source)return;setBusy('new');setError('');const {error}=kind==='damage' ? await supabase().rpc('apply_campaign_typed_damage_2014',{p_campaign:campaignId,p_target:target,p_source:source,p_raw:amount,p_damage_type:damageType}) : await supabase().rpc('apply_campaign_interaction',{p_campaign:campaignId,p_target:target,p_source:source,p_action:kind,p_amount:kind==='condition_add'||kind==='condition_remove'?null:amount,p_detail:kind==='condition_add'||kind==='condition_remove'?detail:null});if(error)setError(error.message);else{setShowForm(false);await load()}setBusy(null)}
 const visibleRolls=rolls.filter(r=>filter==='all'||r.character_id===filter);
 function renderUndo(event:Event) {
  const original=events.find(entry=>entry.id===event.undone_event_id);
  const action=original?.action??event.detail?.match(/^Annulation de ([a-z_]+)$/)?.[1];
  const label=action?undoLabels[action]??'action':'action';
  const condition=(action==='condition_add'||action==='condition_remove')&&original?.detail;
  return <>Annulation · {label}{condition&&<> « {condition} »</>} pour <strong>{name(event.character_id)}</strong></>;
 }
 const renderEvent=(event:Event)=>{const cancelled=undone.has(event.id);const latestForTarget=events.find(e=>e.character_id===event.character_id)?.id===event.id;const allowed=me===ownerId&&event.action!=='undo'&&!cancelled&&latestForTarget&&canControl(event.character_id)&&(event.actor_id===me||ownerId===me);return <div key={event.id} style={{padding:'13px 0',borderBottom:'1px solid var(--border, #665b4c33)',opacity:cancelled?0.55:1}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'start'}}><div>{event.action==='undo'?renderUndo(event):event.action==='damage'?<><strong>{name(event.character_id)}</strong> subit <strong>{event.amount??0} point{event.amount===1?'':'s'} de dégâts</strong></>:<><strong>{name(event.source_character_id||event.character_id)}</strong> {actions[event.action]||event.action} <strong>{name(event.character_id)}</strong>{event.amount!==null&&<> · {event.amount}</>}</>}{event.action!=='undo'&&event.detail&&<> · {event.detail}</>} {cancelled&&<small> (annulée)</small>}<div className="hint">{new Date(event.created_at).toLocaleString('fr-FR')} · Par {user(event.actor_id)}{event.actor_id===ownerId?' (MJ)':''}</div></div>{allowed&&<button type="button" className="btn outline" disabled={!!busy} onClick={()=>undo(event.id)}>Annuler</button>}</div></div>};
 const renderRoll=(r:SharedRoll)=>{const die=chooseD20(r.first_die,r.second_die??r.first_die,r.mode);const total=die+r.modifier;const success=r.kind==='attack'?resolveAttack(die,r.modifier,r.target).hit:resolveSavingThrow(die,r.modifier,r.target).success;return <div key={r.id} style={{padding:'12px 0',borderBottom:'1px solid var(--border, #665b4c33)'}}><strong>{name(r.character_id)}</strong> · {r.kind==='attack'?'Attaque':'Sauvegarde '+r.ability} · {r.source==='physical'?'Dés physiques':'Dés numériques'} · d20 {die} {r.mode!=='normal'?`(${r.first_die} / ${r.second_die}, ${r.mode==='advantage'?'avantage':'désavantage'})`:''} {r.modifier>=0?'+':'−'} {Math.abs(r.modifier)} = <strong>{total}</strong> contre {r.kind==='attack'?'CA':'DD'} {r.target} — <strong>{r.kind==='attack'&&die===20?'Critique':r.kind==='attack'&&die===1?'Échec automatique':success?'Réussite':'Échec'}</strong><div className="hint">{new Date(r.created_at).toLocaleString('fr-FR')} · Par {user(r.actor_id)}</div></div>};
 const recentEvents=activeSession?events.filter(event=>event.session_id===activeSession.id):[];
 const recentRolls=activeSession?rolls.filter(roll=>Date.parse(roll.created_at)>=Date.parse(activeSession.startedAt)):[];
 const feed=recent?[
  ...recentEvents.map(event=>({date:event.created_at,render:()=>renderEvent(event)})),
  ...recentRolls.map(roll=>({date:roll.created_at,render:()=>renderRoll(roll)})),
 ].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,recentLimit):[
  ...visible.filter(event=>category==='all'||event.action===category).map(event=>({date:event.created_at,render:()=>renderEvent(event)})),
  ...((category==='all'||category==='roll')?visibleRolls.map(roll=>({date:roll.created_at,render:()=>renderRoll(roll)})):[]),
  ...((category==='all'||category==='note')?notes.map(note=>({date:note.created_at,render:()=>renderNote(note)})):[]),
 ].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
 return <section className={recent?'mj-journal mj-journal-recent':compact?'mj-journal mj-journal-full':'panel campaign-journal'} style={compact?undefined:{marginTop:24}}>
 {recent?<div className="mj-journal-heading">
  <h2>Dernières actions</h2>
  {me===ownerId&&<details className="mj-journal-add">
   <summary className="btn outline" aria-label="Ajouter au journal">+</summary>
   <div className="mj-journal-add-menu">
    <button className="btn outline" type="button" disabled={!controlledCharacter||!!busy} onClick={event=>{
     event.currentTarget.closest('details')?.removeAttribute('open');setNoteOpen(false);toggleActionForm();
    }}>Enregistrer une action</button>
    <button className="btn outline" type="button" disabled={savingNote||!!busy} onClick={event=>{
     event.currentTarget.closest('details')?.removeAttribute('open');setShowForm(false);setNoteOpen(true);
    }}>Note privée</button>
   </div>
  </details>}
 </div>:compact?<><h2>Journal</h2><div className="mj-journal-filters" aria-label="Filtrer par type">
  {([['all','Tout'],['damage','Dégâts'],['roll','Jets'],['note','Notes']] as const).map(([id,label])=>
   <button className="btn outline" type="button" key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}>{label}</button>)}
 </div></>:<div className="page-head"><span className="eyebrow">CHRONIQUE DES ÉVÉNEMENTS</span><h2>Journal de campagne</h2><p className="hint">Toutes les actions des personnages, dans un même journal. Filtrez par personnage concerné.</p></div>}
 {!recent&&<div className="hp-actions" style={{alignItems:'center'}}><select aria-label="Filtrer le journal" className="field" style={{maxWidth:300}} value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Tous les personnages</option>{named.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>{named.some(c=>canControl(c.id))&&<button className="btn outline" type="button" onClick={toggleActionForm}>{showForm?'Fermer':'+ Enregistrer une action'}</button>}</div>}
 {compact&&(recent?(noteOpen?noteFields:null):noteForm)}
 {showForm&&<form onSubmit={submit} style={{display:'grid',gap:12,margin:'18px 0',maxWidth:580}}><label>Personnage qui agit<select className="field" required value={source} onChange={e=>setSource(e.target.value)}>{named.filter(c=>canControl(c.id)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Cible<select className="field" required value={target} onChange={e=>setTarget(e.target.value)}>{named.filter(c=>canControl(c.id)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Action<select className="field" value={kind} onChange={e=>setKind(e.target.value)}><option value="damage">Dégâts</option><option value="heal">Soins</option><option value="temporary_hp">PV temporaires</option><option value="condition_add">Ajouter une condition</option><option value="condition_remove">Retirer une condition</option></select></label>{kind==='damage'&&<label>Type de dégâts<select className="field" value={damageType} onChange={e=>setDamageType(e.target.value)}>{[['acid','Acide'],['bludgeoning','Contondants'],['cold','Froid'],['fire','Feu'],['force','Force'],['lightning','Foudre'],['necrotic','Nécrotiques'],['piercing','Perforants'],['poison','Poison'],['psychic','Psychiques'],['radiant','Radiants'],['slashing','Tranchants'],['thunder','Tonnerre']].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>}{kind.startsWith('condition_')?<label>Condition<select className="field" value={detail} onChange={e=>setDetail(e.target.value)} required><option value="">Choisir…</option>{['Aveuglé','Charmé','Assourdi','Effrayé','Agrippé','Incapable d’agir','Invisible','Paralysé','Pétrifié','Empoisonné','À terre','Entravé','Étourdi','Inconscient','Épuisement'].map(c=><option key={c}>{c}</option>)}</select></label>:<label>Quantité<input className="field" type="number" min="1" max="9999" required value={amount} onChange={e=>setAmount(Number(e.target.value))}/></label>}<button className="btn gold" disabled={!!busy||!source||!target}>Appliquer et enregistrer</button>{recent&&<button type="button" className="btn outline" onClick={()=>setShowForm(false)}>Fermer</button>}<p className="hint">Pour l'instant, seules les fiches des personnages associés à la campagne peuvent être ciblées. Les monstres et PNJ viendront avec les outils du MJ.</p></form>}
 {error&&<p className="notice error" role="alert">{error}</p>}
 {compact ? <div className="mj-journal-feed">{feed.length ? feed.map(item=>item.render()) :
  <p className="mj-muted">{recent?activeSession?'Aucune action dans cette séance.':'Aucune séance active.':category==='note'?'Aucune note dans le journal.':'Aucun événement à afficher.'}</p>}</div> : <>
 {visible.length===0?<p className="hint" style={{marginTop:18}}>Aucun événement à afficher.</p>:<div className="event-log" style={{marginTop:16}}>{visible.map(renderEvent)}</div>}
 <div style={{marginTop:24}}><h3>Jets partagés</h3><p className="hint">Seuls les jets volontairement publiés apparaissent ici. Les jets physiques non saisis et les actions libres restent possibles.</p>{rolls.filter(r=>filter==='all'||r.character_id===filter).length===0?<p className="hint">Aucun jet partagé.</p>:<div className="event-log">{visibleRolls.map(renderRoll)}</div>}</div>
 <p className="hint" style={{marginTop:12}}>Une action ne peut être annulée que si aucune modification plus récente ne concerne sa cible. Les annulations restent visibles dans le journal.</p>
 <section className="campaign-personal-notes"><h3>Mes notes privées</h3>
  {noteForm}
  {notes.length?notes.map(renderNote):<p className="hint">Aucune note personnelle.</p>}
 </section></>}
 {recent&&<button className="mj-journal-all" type="button" onClick={onViewAll}>Voir tout le journal</button>}
 </section>
}
