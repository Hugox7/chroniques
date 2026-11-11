'use client';
import {useState} from 'react';
import {classCatalogSpells2014,findCatalogSpell2014,type SpellLevel2014} from '@/lib/spell-catalog-2014';

type Props={cls:string;level:SpellLevel2014;value:string;onChange:(value:string)=>void;label:string;exclude?:string[]};
/** Recherche dans les 319 sorts SRD 2014 ; les créations maison restent autorisées. */
export default function SpellChoice2014({cls,level,value,onChange,label,exclude=[]}:Props){
 const [query,setQuery]=useState('');
 const options=classCatalogSpells2014(cls,level).filter(entry=>
  entry.name.toLocaleLowerCase('fr').includes(query.trim().toLocaleLowerCase('fr')) &&
  !exclude.some(name=>name.localeCompare(entry.name,'fr',{sensitivity:'base'})===0));
 const known=findCatalogSpell2014(value,level);
 const mismatch=known&&!known.classes.includes(cls);
 return <div style={{marginBottom:10}}>
  <label className="field-label">{label}</label>
  <input className="field" aria-label={`Rechercher : ${label}`} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher dans le catalogue…" style={{marginBottom:6}}/>
  <select className="field" aria-label={`Choisir : ${label}`} value="" onChange={e=>{if(e.target.value){onChange(e.target.value);setQuery('')}}}>
   <option value="">{options.length?`Choisir parmi ${options.length} sort(s) proposés`:'Aucun sort correspondant'}</option>
   {options.map(entry=><option key={`${entry.level}-${entry.name}`} value={entry.name}>{entry.name}</option>)}
  </select>
  <input className="field" aria-label={`Nom personnalisé : ${label}`} value={value} onChange={e=>onChange(e.target.value)} placeholder="Sort choisi ou nom personnalisé" style={{marginTop:6}}/>
  {known?.description&&<details style={{marginTop:6}}><summary style={{cursor:"pointer"}}>Voir la fiche SRD du sort</summary><p className="hint">{known.school} · Niveau {known.level}{known.ritual?" · Rituel":""}{known.concentration?" · Concentration":""}</p><p className="hint" style={{whiteSpace:"pre-wrap"}}>{known.description}</p></details>}
  {mismatch&&<p className="hint" role="status">Ce sort est répertorié pour d’autres classes : vérifiez les règles de votre table.</p>}
 </div>
}
