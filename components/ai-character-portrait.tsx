'use client';
import {useCallback,useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {parsePortraitAppearance,portraitLabels} from '@/lib/portrait-appearance';
type State={status:string;urls?:string[];error?:string;appearance?:string};
export default function AiCharacterPortrait({characterId,appearance,onChosen}:{characterId:string;appearance:string;onChosen?:()=>void}){
 const [state,setState]=useState<State>({status:'loading'}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const request=useCallback(async(method:'GET'|'POST'|'PATCH',index?:number)=>{
  const {data:{session}}=await supabase().auth.getSession();if(!session)throw new Error('Reconnecte-toi pour accéder aux portraits.');
  const response=await fetch('/api/portraits'+(method==='GET'?`?characterId=${encodeURIComponent(characterId)}`:''),{method,headers:{Authorization:`Bearer ${session.access_token}`,...(method!=='GET'?{'Content-Type':'application/json'}:{})},...(method!=='GET'?{body:JSON.stringify({characterId,index})}:{})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Erreur du service de portraits.');return result as State;
 },[characterId]);
 useEffect(()=>{let active=true;request('GET').then(s=>{if(active)setState(s)}).catch(e=>{if(active){setState({status:'error'});setError(e.message)}});return()=>{active=false}},[request]);
 async function generate(){if(!appearance.trim()||appearance.startsWith('CD_AVATAR_V1:'))return setError('Décris d’abord ton personnage.');
 const parsed=parsePortraitAppearance(appearance);const recap=parsed?Object.entries(parsed.fields).map(([key,value])=>`${portraitLabels[key as keyof typeof portraitLabels]} : ${value}`).join('\n')+`\nDétails : ${parsed.details||'Aucun'}`:appearance.slice(0,500);
 if(!window.confirm(`Dernière vérification avant génération !\n\nApparence : ${recap}\n\nUn portrait définitif sera généré une seule fois, sans possibilité de relancer la génération. Confirmer ?`))return;
 setBusy(true);setError('');try{setState(await request('POST'));onChosen?.()}catch(e){setError((e as Error).message);try{setState(await request('GET'))}catch{}}finally{setBusy(false)}
 }
 async function choose(index:number){if(!window.confirm('Confirmer ce portrait définitivement ? Aucun changement ne sera possible ensuite.'))return;setBusy(true);setError('');try{setState(await request('PATCH',index));onChosen?.()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section style={{marginTop:16}}><h3>Portrait fantasy IA</h3>
 {error&&<p className="notice error" role="alert">{error}</p>}
 {state.status==='loading'&&<p>Chargement du portrait…</p>}
 {state.status==='generating'&&<p>Génération en cours. Actualise la page dans quelques instants.</p>}
 {state.status==='none'&&<><p className="hint">Un portrait définitif sera créé. Vérifie ta description avant de continuer : une seule génération est possible.</p><button type="button" className="btn gold" disabled={busy||!appearance.trim()||appearance.startsWith('CD_AVATAR_V1:')} onClick={generate}>{busy?'Génération en cours…':'Générer mon portrait'}</button></>}
 {state.status==='ready'&&<><p>Choisis ton portrait définitif parmi ces deux propositions.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16}}>{state.urls?.map((url,i)=><div key={i}><img src={url} alt={`Portrait proposé ${i+1}`} style={{width:'100%',aspectRatio:'2 / 3',objectFit:'cover',borderRadius:12}}/><button type="button" className="btn gold" disabled={busy} onClick={()=>choose(i)}>Choisir ce portrait</button></div>)}</div></>}
 {state.status==='chosen'&&<><p className="hint">Portrait définitif enregistré.</p>{state.urls?.[0]&&<img src={state.urls[0]} alt="Portrait définitif du personnage" style={{width:'min(100%,300px)',aspectRatio:'2 / 3',objectFit:'cover',borderRadius:12}}/>}</>}
 </section>
}
