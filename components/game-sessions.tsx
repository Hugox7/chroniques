'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
type Session={id:string;status:'active'|'completed'|'cancelled';started_at:string;ended_at:string|null};
export default function GameSessions({campaignId,isGM}:{campaignId:string;isGM:boolean}){
 const [sessions,setSessions]=useState<Session[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){const {data,error}=await supabase().from('game_sessions').select('id,status,started_at,ended_at').eq('campaign_id',campaignId).order('started_at',{ascending:false});if(error)setError(error.message);else setSessions(data??[])}
 useEffect(()=>{void load()},[campaignId]);
 async function action(fn:string,args:Record<string,unknown>){setBusy(true);setError('');try{const {error}=await supabase().rpc(fn,args);if(error)throw error;await load()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const active=sessions.find(s=>s.status==='active');
 return <div className="panel" style={{marginTop:20}}><h2>Partie · Séances</h2><p className="hint">Chaque début de séance sauvegarde automatiquement les fiches complètes des personnages associés. Les joueurs peuvent consulter leurs sauvegardes sur leur fiche.</p>
 {error&&<div className="notice error">{error}</div>}
 {isGM&&!active&&<button className="btn gold" disabled={busy} onClick={()=>void action('start_game_session',{p_campaign:campaignId})}>Commencer une séance</button>}
 {sessions.length===0&&<p className="muted">Aucune séance enregistrée.</p>}
 {sessions.map(s=><div className="member" key={s.id} style={{flexWrap:'wrap',gap:12}}><span><strong>{new Date(s.started_at).toLocaleString('fr-FR')}</strong><small style={{display:'block'}}>{s.status==='active'?'En cours':s.status==='completed'?'Terminée':'Annulée'}</small></span>{isGM&&<span style={{display:'flex',gap:8,flexWrap:'wrap'}}>{s.status==='active'&&<><button className="btn outline" disabled={busy} onClick={()=>void action('finish_game_session',{p_session:s.id,p_cancel:false})}>Terminer</button><button className="btn outline" disabled={busy} onClick={()=>void action('finish_game_session',{p_session:s.id,p_cancel:true})}>Annuler</button></>}<button className="btn outline" disabled={busy} onClick={()=>{if(confirm('Supprimer cette séance ? Les statistiques des personnages ne seront PAS restaurées. Les événements de campagne ne seront PAS effacés automatiquement. Vérifiez les fiches des participants avant de confirmer.'))void action('delete_game_session',{p_session:s.id})}}>Supprimer</button></span>}</div>)}
 </div>;
}
