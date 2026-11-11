'use client';
import {useEffect,useRef,useState} from 'react';
import CampaignBestiary2014 from '@/components/campaign-bestiary-2014';
import CampaignCharacterControl from '@/components/campaign-character-control';
import SessionSummaryEditor from '@/components/session-summary';
import SessionInitiative2014 from '@/components/session-initiative-2014';
import type {Character} from '@/lib/rules';
import {supabase} from '@/lib/supabase';
type Participant={user_id:string;character_id:string|null};
type Session={id:string;status:'active'|'completed'|'cancelled';started_at:string;ended_at:string|null};
export default function GameSessions({campaignId,isGM,campaignStatus,participants,gmId,characters,me=gmId,onActiveSessionChange}:{campaignId:string;isGM:boolean;campaignStatus:string;participants:Participant[];gmId:string;characters:Character[];me?:string;onActiveSessionChange?:(session:{id:string;startedAt:string}|null)=>void}){
 const [sessions,setSessions]=useState<Session[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const inFlight=useRef(false);
 const loadSequence=useRef(0);
 const [loading,setLoading]=useState(true);
 const [reviewSession,setReviewSession]=useState<string|null>(null);
 async function load(){const sequence=++loadSequence.current;const {data,error}=await supabase().from('game_sessions').select('id,status,started_at,ended_at').eq('campaign_id',campaignId).order('started_at',{ascending:false});if(sequence!==loadSequence.current)return;if(error)setError(error.message);else {setSessions(data??[]);setError('')}setLoading(false)}
 useEffect(()=>{setLoading(true);setSessions([]);setError('');void load();const db=supabase();const channel=db.channel(`sessions-${campaignId}`).on('postgres_changes',{event:'*',schema:'public',table:'game_sessions',filter:`campaign_id=eq.${campaignId}`},()=>{void load()}).subscribe();return()=>{loadSequence.current++;void db.removeChannel(channel)}},[campaignId]);
 async function action(fn:string,args:Record<string,unknown>){if(inFlight.current)return false;inFlight.current=true;setBusy(true);setError('');try{const {error}=await supabase().rpc(fn,args);if(error)throw error;await load();return true}catch(e){setError(e instanceof Error?e.message:'Une erreur est survenue pendant cette action.');return false}finally{inFlight.current=false;setBusy(false)}}
 async function finishSession(session:Session,cancel:boolean){
  const message=cancel?'Annuler cette séance ? Les modifications des personnages ne seront pas restaurées automatiquement.':'Terminer cette séance ? Les modifications des personnages seront conservées.';
  if(confirm(message)&&await action('finish_game_session',{p_session:session.id,p_cancel:cancel})&&!cancel)setReviewSession(session.id);
 }
 async function removeSession(id:string){
  // Keep the mutation lock for the whole read/confirm/delete sequence.
  // Otherwise a second click can start a competing operation during confirmation.
  if(inFlight.current)return;
  inFlight.current=true;setBusy(true);setError('');
  try{
   const db=supabase();
   const [{count:events,error:eventError},{count:snapshots,error:snapshotError},{count:summaries,error:summaryError}]=await Promise.all([
    db.from('campaign_character_events').select('id',{count:'exact',head:true}).eq('session_id',id),
    db.from('session_character_snapshots').select('id',{count:'exact',head:true}).eq('session_id',id),
    db.from('session_summaries').select('session_id',{count:'exact',head:true}).eq('session_id',id)
   ]);
   if(eventError||snapshotError||summaryError)throw eventError??snapshotError??summaryError??new Error('Erreur de vérification');
   const destructive=(events??0)+(snapshots??0)+(summaries??0)>0;
   const message=destructive
    ?`ATTENTION : cette séance contient ${events} événement(s), ${snapshots} sauvegarde(s) et ${summaries} résumé(s). Les résumés et sauvegardes seront définitivement supprimées. Le journal historique restera, sans rattachement à cette séance. Les fiches ne seront pas restaurées. Continuer ?`
    :'Supprimer cette séance vide ? Aucune fiche ne sera restaurée.';
   if(!confirm(message))return;
   const {error:deleteError}=await db.rpc('delete_game_session',{p_session:id,p_confirm_data_loss:destructive});
   if(deleteError)throw deleteError;
   await load();
  }catch(e){setError(e instanceof Error?e.message:'Impossible de supprimer cette séance.');}
  finally{inFlight.current=false;setBusy(false)}
 }

 const players=participants.filter(p=>p.user_id!==gmId);
 const assigned=players.filter(p=>Boolean(p.character_id));
 const unassigned=players.length-assigned.length;
 const ready=players.length>0&&unassigned===0;
 async function startSession(){
  if(!ready){
   const message=players.length===0
    ?'Aucun joueur n’a encore rejoint cette campagne. Commencer une séance sans joueur ?'
    :`${unassigned} joueur(s) n’ont pas encore associé de personnage. Leurs fiches ne seront pas sauvegardées au démarrage. Continuer ?`;
   if(!confirm(message))return;
  }
  await action('start_game_session',{p_campaign:campaignId});
 }
 const active=sessions.find(s=>s.status==='active');
 const activeId=active?.id,startedAt=active?.started_at;
 useEffect(()=>{
  onActiveSessionChange?.(activeId&&startedAt?{id:activeId,startedAt}:null);
 },[activeId,startedAt,onActiveSessionChange]);
 const playerCharacterId=participants.find(p=>p.user_id===me)?.character_id;
 const sessionNumber=active ? sessions.filter(s=>new Date(s.started_at)<=new Date(active.started_at)).length : 0;
 return <section className="mj-session" aria-label="Séance">
  <div className="mj-session-bar">
   <strong>{active ? `Séance ${sessionNumber} en cours` : 'Séance'}</strong>
   {isGM&&<div className="hp-actions">
    {!active&&<CampaignBestiary2014 key={campaignId} campaignId={campaignId}/>}
    {active ? <button className="btn outline mj-session-end" disabled={busy} onClick={()=>finishSession(active,false)}>Terminer la séance</button>
    : <button className="btn gold" disabled={busy||loading||campaignStatus!=='active'} onClick={()=>void startSession()}>Commencer une séance</button>}
   </div>}
  </div>
  {isGM&&reviewSession&&<SessionSummaryEditor key={reviewSession} sessionId={reviewSession} autoOpen onClose={()=>setReviewSession(null)}/>}
  {error&&<p role="alert" className="notice error">{error}</p>}
  {loading&&<p role="status" className="mj-muted">Chargement de la séance…</p>}
  {!loading&&!active&&<p className="mj-muted">{!isGM ? 'Le MJ n’a pas encore ouvert de séance.' : campaignStatus==='active'
   ? 'La séance commence par une sauvegarde des fiches.'
   : 'Lance la campagne pour ouvrir une séance.'}</p>}
  {active&&<SessionInitiative2014 key={active.id} sessionId={active.id} isGM={isGM} characters={characters} campaignId={campaignId} gmId={gmId} me={me} playerCharacterId={playerCharacterId}/>}
  {!loading&&!active&&characters.length>0&&<section className="mj-initiative" aria-label="Fiches de la compagnie">
   <h2>Fiches de la compagnie</h2>
   <ul className="mj-roster">
    {characters.map(character=><li key={character.id}>
     <CampaignCharacterControl campaignId={campaignId} character={character} me={me}
      canEdit={isGM||character.id===playerCharacterId} isGM={isGM} initiative={{outOfSession:true}}/>
    </li>)}
   </ul>
  </section>}
  {sessions.length>0&&<details className="mj-disclosure">
   <summary>{isGM?'Historique et options de séance':'Historique des séances'}</summary>
   {sessions.map(session=><div className="member" key={session.id}>
    <span>{new Date(session.started_at).toLocaleString('fr-FR')} · {session.status==='active'?'En cours':session.status==='completed'?'Terminée':'Annulée'}</span>
    {isGM&&(session.status==='active'
     ? <button className="btn outline mj-risk" disabled={busy} onClick={()=>finishSession(session,true)}>Annuler la séance</button>
     : <button className="btn outline mj-risk" disabled={busy} onClick={()=>void removeSession(session.id)}>Supprimer la séance</button>)}
   </div>)}
  </details>}
 </section>;
}
