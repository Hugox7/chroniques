'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from '@/lib/supabase';
import {BookOpen,Eye,EyeOff,FilePlus2,Pencil,Trash2,X,Upload,FileText} from 'lucide-react';

type Template='parchment'|'wanted'|'ancient';
type Document={kind:'written'|'upload';storage_path:string|null;mime_type:string|null;recipient_id:string|null;id:string;campaign_id:string;author_id:string;template:Template;title:string;subtitle:string;body:string;signature:string;published_at:string|null;created_at:string};
const templates:{value:Template;label:string;description:string}[]=[
 {value:'parchment',label:'Parchemin',description:'Lettre, missive ou ordre de mission'},
 {value:'wanted',label:'Avis de recherche',description:'Affiche et récompense'},
 {value:'ancient',label:'Document ancien',description:'Indice, fragment ou journal oublié'}
];
const blank={template:'parchment' as Template,title:'',subtitle:'',body:'',signature:''};

export default function CampaignDocuments({campaignId,isGM,profiles,visible=true}:{campaignId:string;isGM:boolean;profiles:{id:string;username:string}[];visible?:boolean}){
 const [docs,setDocs]=useState<Document[]>([]);
 const [editing,setEditing]=useState<string|null>(null);
 const [creating,setCreating]=useState(false);
 const [form,setForm]=useState(blank);
 const [view,setView]=useState<Document|null>(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [mode,setMode]=useState<'written'|'upload'>('written');
 const [file,setFile]=useState<File|null>(null);
 const [recipient,setRecipient]=useState('all');
 const [members,setMembers]=useState<{user_id:string}[]>([]);
 const [recipients,setRecipients]=useState<Record<string,string>>({});
 const [fileUrl,setFileUrl]=useState<string|null>(null);
 const seen=useRef<Map<string,string|null>|null>(null);
 const load=useCallback(async()=>{
  const {data,error}=await supabase().from('campaign_documents').select('id,campaign_id,author_id,template,title,subtitle,body,signature,published_at,created_at,kind,storage_path,mime_type,recipient_id').eq('campaign_id',campaignId).order('created_at',{ascending:false});
  if(error)setError(error.message);else {const next=(data??[]) as Document[];if(seen.current&&!isGM){const revealed=next.find(d=>d.published_at&&d.published_at!==seen.current?.get(d.id));if(revealed)setView(revealed)}seen.current=new Map(next.map(d=>[d.id,d.published_at]));setDocs(next)}
  setLoading(false);
 },[campaignId,isGM]);
 useEffect(()=>{if(isGM){void supabase().from('campaign_members').select('user_id').eq('campaign_id',campaignId).then(({data})=>setMembers(data??[]))}void load();const s=supabase();const channel=s.channel(`campaign-documents-${campaignId}`).on('postgres_changes',{event:'*',schema:'public',table:'campaign_documents',filter:`campaign_id=eq.${campaignId}`},()=>{void load()}).subscribe();return()=>{void s.removeChannel(channel)}},[campaignId,load]);
 function startNew(nextMode:'written'|'upload'='written'){setEditing(null);setRecipient('all');setMode(nextMode);setFile(null);setForm(blank);setCreating(true);setError('')}
 function startEdit(doc:Document){setEditing(doc.id);setRecipient(doc.recipient_id??'all');setMode(doc.kind);setFile(null);setForm({template:doc.template,title:doc.title,subtitle:doc.subtitle,body:doc.body,signature:doc.signature});setCreating(true);setError('')}
 async function save(e:React.FormEvent){
  e.preventDefault();if(!isGM||!form.title.trim()||(mode==='upload'&&!editing&&!file))return;
  setBusy(true);setError('');const s=supabase();
  try{
   const values={kind:mode,template:form.template,title:form.title.trim(),subtitle:form.subtitle.trim(),body:form.body,signature:form.signature.trim()};
   if(editing){
    const {error}=await s.from('campaign_documents').update(values).eq('id',editing).eq('campaign_id',campaignId);
    if(error)throw error;
   }else{
    const {data:{user}}=await s.auth.getUser();if(!user)throw Error('Session expirée');
    const {data:doc,error}=await s.from('campaign_documents').insert({...values,campaign_id:campaignId,author_id:user.id}).select('id').single();
    if(error)throw error;
    if(mode==='upload'&&file){
     const ext=file.type==='application/pdf'?'pdf':file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
     const path=`${campaignId}/${doc.id}/document.${ext}`;
     const {error:linkError}=await s.from('campaign_documents').update({storage_path:path,mime_type:file.type}).eq('id',doc.id);
     if(linkError){await s.from('campaign_documents').delete().eq('id',doc.id);throw linkError}
     const {error:uploadError}=await s.storage.from('campaign-documents').upload(path,file,{contentType:file.type,upsert:false});
     if(uploadError){await s.from('campaign_documents').delete().eq('id',doc.id);throw uploadError}
    }
   }
   setCreating(false);setEditing(null);setFile(null);await load();
  }catch(e){setError(e instanceof Error?e.message:'Impossible d’enregistrer le document')}finally{setBusy(false)}
 }
 async function publish(doc:Document){
  if(!isGM)return;
  if(doc.published_at){if(!window.confirm('Masquer ce document ?'))return}
  else if(doc.kind==='upload'&&!doc.storage_path){setError('Fichier manquant.');return}
  else if(!window.confirm((recipients[doc.id]??'all')==='all'?'Révéler ce document à tous les joueurs ?':'Révéler ce document uniquement au joueur sélectionné ?'))return;
  setBusy(true);setError('');
  const {error}=await supabase().from('campaign_documents').update({published_at:doc.published_at?null:new Date().toISOString(),recipient_id:doc.published_at?doc.recipient_id:(recipients[doc.id]??'all')==='all'?null:recipients[doc.id]}).eq('id',doc.id).eq('campaign_id',campaignId);
  if(error)setError(error.message);await load();setBusy(false);
 }
 async function remove(doc:Document){if(!isGM||!window.confirm(`Supprimer définitivement « ${doc.title} » ?`))return;setBusy(true);setError('');if(doc.storage_path){const {error:storageError}=await supabase().storage.from('campaign-documents').remove([doc.storage_path]);if(storageError){setError(storageError.message);setBusy(false);return}}const {error}=await supabase().from('campaign_documents').delete().eq('id',doc.id).eq('campaign_id',campaignId);if(error)setError(error.message);await load();setBusy(false)}
 useEffect(()=>{let cancelled=false;setFileUrl(null);if(view?.kind==='upload'&&view.storage_path){void supabase().storage.from('campaign-documents').createSignedUrl(view.storage_path,600).then(({data,error})=>{if(!cancelled){if(error)setError(error.message);else setFileUrl(data?.signedUrl??null)}})}return()=>{cancelled=true}},[view]);
 return <><section className="panel campaign-documents" id="campaign-view-documents" hidden={!visible}>
  <div className="page-head"><span className="eyebrow">ARCHIVES DE LA CAMPAGNE</span><h2><BookOpen size={21} style={{verticalAlign:'middle',marginRight:8}}/>Documents et découvertes</h2><p className="hint">Lettres, affiches et indices révélés au fil de l'aventure. {isGM?'Les brouillons restent invisibles aux joueurs.':''}</p></div>
  {isGM&&<button type="button" className="btn gold" onClick={()=>startNew('written')}><FilePlus2 size={16}/> Créer un document</button>}
  {isGM&&<button type="button" className="btn outline" style={{marginLeft:8}} onClick={()=>startNew('upload')}><Upload size={16}/> Importer un PDF ou une image</button>}
  {error&&<p className="notice error" role="alert">{error}</p>}
  {creating&&isGM&&<form onSubmit={save} className="document-editor"><div className="hp-actions" style={{justifyContent:'space-between'}}><h3>{editing?'Modifier le document':'Nouveau document'}</h3><button className="btn outline" type="button" onClick={()=>setCreating(false)}><X size={16}/> Fermer</button></div>
   {mode==='upload'&&<label>Fichier PDF, PNG, JPG ou WebP (10 Mo maximum)<input className="field" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp" disabled={!!editing} onChange={e=>{const next=e.target.files?.[0]??null;setFile(null);if(next&&(!['application/pdf','image/png','image/jpeg','image/webp'].includes(next.type)||next.size>10485760)){setError('Format non autorisé ou fichier supérieur à 10 Mo.')}else{setError('');setFile(next);if(next&&!form.title.trim())setForm(prev=>({...prev,title:next.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ')}))}}}/>{editing&&<small>Pour remplacer le fichier, créez un nouveau document importé.</small>}</label>}
   {mode==='upload'&&<label>Titre du document<input className="field" required maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ex. Carte du donjon"/></label>}
   {mode==='written'&&<><label>Présentation<select className="field" value={form.template} onChange={e=>setForm({...form,template:e.target.value as Template})}>{templates.map(t=><option key={t.value} value={t.value}>{t.label} — {t.description}</option>)}</select></label>
   <label>Titre<input className="field" required maxLength={160} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="La missive du roi"/></label>
   <label>Sous-titre (facultatif)<input className="field" maxLength={240} value={form.subtitle} onChange={e=>setForm({...form,subtitle:e.target.value})} placeholder="À l'attention des aventuriers"/></label>
   <label>Contenu<textarea className="field" rows={8} maxLength={20000} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Il y a trois nuits…"/></label>
   <label>Signature ou récompense (facultatif)<input className="field" maxLength={160} value={form.signature} onChange={e=>setForm({...form,signature:e.target.value})} placeholder="Signé : le capitaine de la garde"/></label></>}
   {mode==='written'&&<><h3>Aperçu</h3><DocumentPaper doc={form}/></>}<button className="btn gold" disabled={busy||!form.title.trim()||(mode==='upload'&&!editing&&!file)} type="submit">{busy?'Enregistrement…':'Enregistrer le brouillon'}</button>
  </form>}
  <div className="document-grid">{docs.map(doc=><article key={doc.id} className="document-list-item"><button type="button" className="document-open" onClick={()=>setView(doc)}><span className="document-icon">{doc.kind==='upload'?'📎':doc.template==='wanted'?'⚖':doc.template==='ancient'?'✦':'✉'}</span><strong>{doc.title}</strong><small>{doc.kind==='upload'?'Fichier importé':templates.find(t=>t.value===doc.template)?.label}</small><small>{doc.published_at?(doc.recipient_id?'Révélé à un joueur · ':'Tous les joueurs · '):''}{doc.published_at?'Révélé le '+new Date(doc.published_at).toLocaleDateString('fr-FR'):'Brouillon privé'}</small></button>{isGM&&<div className="document-actions"><button className="btn outline" type="button" onClick={()=>startEdit(doc)}><Pencil size={15}/> Modifier</button>{!doc.published_at&&<select className="field" aria-label="Destinataire de la révélation" value={recipients[doc.id]??'all'} onChange={e=>setRecipients(prev=>({...prev,[doc.id]:e.target.value}))}><option value="all">Tous les joueurs</option>{members.filter(m=>m.user_id!==doc.author_id).map(m=><option key={m.user_id} value={m.user_id}>{profiles.find(p=>p.id===m.user_id)?.username || 'Aventurier'}</option>)}</select>}<button className="btn outline" disabled={busy} type="button" onClick={()=>publish(doc)}>{doc.published_at?<EyeOff size={15}/>:<Eye size={15}/>} {doc.published_at?'Masquer':'Révéler'}</button><button className="btn outline" disabled={busy} type="button" onClick={()=>remove(doc)} aria-label={`Supprimer ${doc.title}`}><Trash2 size={15}/></button></div>}</article>)}</div>
  {!loading&&docs.length===0&&<p className="hint" style={{marginTop:18}}>{isGM?'Aucun document pour le moment. Créez votre premier indice !':'Aucun document n’a encore été révélé.'}</p>}
 </section>
  {view&&<div className="document-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setView(null)}}><div className="document-modal" role="dialog" aria-modal="true" aria-label={view.title}><button type="button" className="btn outline document-close" onClick={()=>setView(null)}><X size={18}/> Fermer</button>{view.kind==='upload'?(fileUrl?(view.mime_type==='application/pdf'?<iframe className="document-file-preview" title={view.title} src={fileUrl}/>:<img className="document-image-preview" src={fileUrl} alt={view.title}/>):<p className="hint">Chargement du document…</p>):<DocumentPaper doc={view}/>}</div></div>}
 </>
}
function DocumentPaper({doc}:{doc:Pick<Document,'template'|'title'|'subtitle'|'body'|'signature'>}){return <div className={`document-paper document-paper-${doc.template}`}><div className="document-paper-ornament">✦ ❧ ✦</div>{doc.template==='wanted'&&<div className="document-paper-kicker">AVIS DE RECHERCHE</div>}<h3>{doc.title||'Titre du document'}</h3>{doc.subtitle&&<p className="document-paper-subtitle">{doc.subtitle}</p>}<div className="document-paper-body">{doc.body||'Votre texte apparaîtra ici…'}</div>{doc.signature&&<div className="document-paper-signature">{doc.signature}</div>}<div className="document-paper-ornament">❧</div></div>}
