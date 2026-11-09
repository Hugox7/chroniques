'use client';
import {useEffect,useRef,useState} from 'react';
import {supabase} from '@/lib/supabase';
type Participant={user_id:string;character_id:string|null};
type Session={id:string;status:'active'|'completed'|'cancelled';started_at:string;ended_at:string|null};
export default function GameSessions({campaignId,isGM,campaignStatus,participants,gmId}:{campaignId:string;isGM:boolean;campaignStatus:string;participants:Participant[];gmId:string}){
 const [sessions,setSessions]=useState<Session[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const inFlight=useRef(false);
 const loadSequence=useRef(0);
 const [loading,setLoading]=useState(true);
 async function load(){const sequence=++loadSequence.current;const {data,error}=await supabase().from('game_sessions').select('id,status,started_at,ended_at').eq('campaign_id',campaignId).order('started_at',{ascending:false});if(sequence!==loadSequence.current)return;if(error)setError(error.message);else {setSessions(data??[]);setError('')}setLoading(false)}
 useEffect(()=>{setLoading(true);setSessions([]);setError('');void load();const db=supabase();const channel=db.channel(`sessions-${campaignId}`).on('postgres_changes',{event:'*',schema:'public',table:'game_sessions',filter:`campaign_id=eq.${campaignId}`},()=>{void load()}).subscribe();return()=>{loadSequence.current++;void db.removeChannel(channel)}},[campaignId]);
 async function action(fn:string,args:Record<string,unknown>){if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');try{const {error}=await supabase().rpc(fn,args);if(error)throw error;await load()}catch(e){setError(e instanceof Error?e.message:'Une erreur est survenue pendant cette action.')}finally{inFlight.current=false;setBusy(false)}}
 function finishSession(session:Session,cancel:boolean){
  const message=cancel?'Annuler cette séance ? Les modifications des personnages ne seront pas restaurées automatiquement.':'Terminer cette séance ? Les modifications des personnages seront conservées.';
  if(confirm(message))void action('finish_game_session',{p_session:session.id,p_cancel:cancel});
 }
 async function removeSession(id:string){
  // Keep the mutation lock for the whole read/confirm/delete sequence.
  // Otherwise a second click can start a competing operation during confirmation.
  if(inFlight.current)return;
  inFlight.current=true;setBusy(true);setError('');
  try{
   const db=supabase();
   const [{count:events,error:eventError},{count:snapshots,error:snapshotError}]=await Promise.all([
    db.from('campaign_character_events').select('id',{count:'exact',head:true}).eq('session_id',id),
    db.from('session_character_snapshots').select('id',{count:'exact',head:true}).eq('session_id',id)
   ]);
   if(eventError||snapshotError)throw eventError??snapshotError??new Error('Erreur de vérification');
   const destructive=(events??0)+(snapshots??0)>0;
   const message=destructive
    ?`ATTENTION : cette séance contient ${events} événement(s) et ${snapshots} sauvegarde(s). Les sauvegardes seront définitivement supprimées. Le journal historique restera, sans rattachement à cette séance. Les fiches ne seront pas restaurées. Continuer ?`
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
 const completed=sessions.filter(s=>s.status==='completed').length;
 const sessionNumber=active ? sessions.filter(s=>new Date(s.started_at)<=new Date(active.started_at)).length : 0;
 return <div className="panel" id="campaign-sessions" style={{marginTop:20,scrollMarginTop:24}}>{loading&&<p className="hint" role="status">Chargement des séances…</p>}{!loading&&active&&<section className="session-active-banner" role="status" aria-label="Séance active" style={{display:'block',padding:20}}><div style={{display:'flex',alignItems:'center',gap:10}}><span className="session-live-dot"/><strong>Séance {sessionNumber} en cours</strong></div><p>Début : {new Date(active.started_at).toLocaleString('fr-FR')} · {completed} séance(s) terminée(s)</p><p>Accès rapide aux outils de cette partie :</p><nav aria-label="Outils de séance" style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:12}}><a className="btn gold" href="#campaign-sheets">PV et ressources</a><a className="btn outline" href="#campaign-journal">Journal de partie</a><a className="btn outline" href="#campaign-company">La compagnie</a></nav>{isGM&&<div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:18}}><button className="btn outline" disabled={busy} onClick={()=>finishSession(active,false)}>Terminer la séance</button><button className="btn outline" disabled={busy} onClick={()=>finishSession(active,true)}>Annuler la séance</button></div>}</section>}<h2>Partie · Séances</h2><p className="hint">Chaque début de séance sauvegarde automatiquement les fiches complètes des personnages associés. Les joueurs peuvent consulter leurs sauvegardes sur leur fiche.</p>
 {error&&<div className="notice error">{error}</div>}
 {isGM&&campaignStatus==='draft'&&<p className="hint">Impossible de commencer une séance : la campagne est en brouillon.</p>}
 {!active&&campaignStatus==='active'&&!isGM&&<p className="hint">Aucune séance active. Le maître du jeu peut démarrer la prochaine partie.</p>}
 {isGM&&!loading&&!active&&<section className="session-readiness" aria-label="Préparation de la séance" style={{margin:'16px 0',padding:16,border:'1px solid var(--border, #73624b)',borderRadius:12}}>
 <h3 style={{marginTop:0}}>Avant de lancer la séance</h3>
 <p className="hint" role="status">{assigned.length} personnage(s) associé(s) sur {players.length} joueur(s) inscrit(s).</p>
 {ready?<p>✓ La compagnie est prête : chaque joueur a choisi un personnage.</p>:<p className="hint">{players.length===0?'Aucun joueur inscrit pour le moment.':`${unassigned} joueur(s) doivent encore sélectionner leur personnage dans « La compagnie ».`} Les personnages non associés ne seront pas inclus dans les sauvegardes automatiques.</p>}
 <button className="btn gold" disabled={busy||campaignStatus!=='active'} onClick={()=>void startSession()}>{busy?'Démarrage…':'Commencer une séance'}</button>
 {campaignStatus!=='active'&&<p className="hint">La campagne doit être en cours pour démarrer une séance.</p>}
 </section>}
 {!loading&&sessions.length===0&&<p className="muted">Aucune séance enregistrée.</p>}
 {sessions.map(s=><div className="member" key={s.id} style={{flexWrap:'wrap',gap:12}}><span><strong>{new Date(s.started_at).toLocaleString('fr-FR')}</strong><small style={{display:'block'}}>{s.status==='active'?'En cours':s.status==='completed'?'Terminée':'Annulée'}</small></span>{isGM&&<span style={{display:'flex',gap:8,flexWrap:'wrap'}}>{s.status==='active'&&<><button className="btn outline" disabled={busy} onClick={()=>finishSession(s,false)}>Terminer</button><button className="btn outline" disabled={busy} onClick={()=>finishSession(s,true)}>Annuler</button></>}<button className="btn outline" disabled={busy} onClick={()=>void removeSession(s.id)}>Supprimer</button></span>}</div>)}
 </div>;
}
