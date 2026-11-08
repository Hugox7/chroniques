'use client';
import {useState} from 'react';
import type {Character} from '@/lib/rules';

type Item={id:string;name:string;quantity:number;description?:string};
function normalize(values:Character['inventory']):Item[]{return (values??[]).map((value,index)=>typeof value==='string'?{id:`legacy-${index}`,name:value,quantity:1}:value).filter((x):x is Item=>Boolean(x&&typeof x.name==='string'));}
export default function FreeInventory({character,onSave}:{character:Character;onSave:(changes:Partial<Character>)=>Promise<void>}){
 const [name,setName]=useState('');const [quantity,setQuantity]=useState(1);const [busy,setBusy]=useState(false);
 const items=normalize(character.inventory);
 async function persist(next:Item[]){setBusy(true);try{await onSave({inventory:next})}finally{setBusy(false)}}
 return <div className="panel full"><h2>Inventaire libre</h2><p className="hint">Ajoute les objets de ton choix, sans catalogue imposé. Les anciens équipements sont conservés.</p>
 {items.length===0&&<p className="muted">Ton sac est vide pour le moment.</p>}
 {items.map(item=><div className="member" key={item.id} style={{gap:12,flexWrap:'wrap'}}><strong style={{flex:1,minWidth:140}}>{item.name}</strong><label style={{display:'flex',alignItems:'center',gap:8}}>Quantité <input className="field" aria-label={`Quantité de ${item.name}`} type="number" min="0" max="999999" style={{width:90}} value={item.quantity} disabled={busy} onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=0&&n<=999999)void persist(items.map(x=>x.id===item.id?{...x,quantity:n}:x))}}/></label><button type="button" className="btn outline" disabled={busy} onClick={()=>{if(confirm(`Retirer « ${item.name} » de l'inventaire ?`))void persist(items.filter(x=>x.id!==item.id))}}>Retirer</button></div>)}
 <form onSubmit={e=>{e.preventDefault();if(!name.trim()||!Number.isInteger(quantity)||quantity<0)return;void persist([...items,{id:crypto.randomUUID(),name:name.trim(),quantity}]).then(()=>{setName('');setQuantity(1)})}} style={{marginTop:18}}><label className="field-label">AJOUTER UN OBJET</label><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><input className="field" style={{flex:1,minWidth:160}} maxLength={120} required placeholder="Nom de l'objet" value={name} onChange={e=>setName(e.target.value)}/><input className="field" aria-label="Quantité initiale" type="number" min="0" max="999999" style={{width:95}} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/><button className="btn gold" disabled={busy} type="submit">Ajouter</button></div></form></div>;
}
