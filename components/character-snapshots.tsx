'use client';
import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
type Snapshot={id:string;created_at:string;session_id:string;snapshot:{name?:string;level?:number;hp_current?:number;hp_max?:number}};
export default function CharacterSnapshots({characterId,onRestored}:{characterId:string;onRestored:()=>Promise<void>}){
 const [rows,setRows]=useState<Snapshot[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){const {data,error}=await supabase().from('session_character_snapshots').select('id,created_at,session_id,snapshot').eq('character_id',characterId).order('created_at',{ascending:false});if(error)setError(error.message);else setRows(data??[])}
 useEffect(()=>{void load()},[characterId]);
 async function restore(row:Snapshot){const newer=rows.filter(x=>new Date(x.created_at)>new Date(row.created_at)).length;if(!confirm(`Restaurer la fiche COMPLÈTE du ${new Date(row.created_at).toLocaleString('fr-FR')} ?\n\nLes valeurs actuelles et l'inventaire seront remplacés. ${newer} sauvegarde(s) plus récente(s) seront supprimée(s). Cette opération est irréversible.`))return;setBusy(true);setError('');try{const {error}=await supabase().rpc('restore_session_character',{p_snapshot:row.id});if(error)throw error;await load();await onRestored()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <div className="panel full"><h2>Sauvegardes de début de séance</h2><p className="hint">Chaque sauvegarde contient la fiche entière, inventaire compris. Restaurer une date supprime les sauvegardes ultérieures de ce personnage.</p>{error&&<div className="notice error">{error}</div>}{rows.length===0?<p className="muted">Aucune sauvegarde pour le moment.</p>:rows.map(row=><div className="member" key={row.id} style={{gap:10,flexWrap:'wrap'}}><span><strong>{new Date(row.created_at).toLocaleString('fr-FR')}</strong><small style={{display:'block'}}>Niveau {row.snapshot.level??'?'} · {row.snapshot.hp_current??'?'} / {row.snapshot.hp_max??'?'} PV</small></span><button type="button" className="btn outline" disabled={busy} onClick={()=>void restore(row)}>Restaurer</button></div>)}</div>;
}
