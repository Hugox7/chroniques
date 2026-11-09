'use client';
import {useState} from 'react';
import {supabase} from '@/lib/supabase';
import type {Character} from '@/lib/rules';

export default function GMCharacterCorrection({campaignId,character,enabled,onSaved}:{campaignId:string;character:Character;enabled:boolean;onSaved:()=>Promise<void>}){
 const [notes,setNotes]=useState(character.notes??'');
 const [hp,setHp]=useState(character.hp_current);
 const [gold,setGold]=useState(character.remaining_gold??0);
 const [maxHp,setMaxHp]=useState(character.hp_max);
 const [tempHp,setTempHp]=useState(character.temporary_hp??0);
 const [inspiration,setInspiration]=useState(character.inspiration??false);
 const [features,setFeatures]=useState(character.features??'');
 const [spellNotes,setSpellNotes]=useState(character.spellcasting_notes??'');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false);
 if(!enabled)return <p className="hint">Le joueur n'autorise pas les corrections hors séance.</p>;
 async function save(){setBusy(true);setError('');setDone(false);
  const {error}=await supabase().rpc('gm_correct_character',{p_campaign:campaignId,p_character:character.id,p_changes:{notes,hp_current:hp,hp_max:maxHp,temporary_hp:tempHp,remaining_gold:gold,inspiration,features,spellcasting_notes:spellNotes}});
  if(error)setError(error.message);else{setDone(true);await onSaved()}setBusy(false);
 }
 return <section className="panel"><h4>Correction hors séance · {character.name}</h4>
  <p className="hint">Avec l'accord du joueur. Les modifications sont enregistrées dans l'historique d'audit.</p>
  <label>PV actuels<input className="field" type="number" min="0" value={hp} onChange={e=>setHp(Number(e.target.value))}/></label>
  <label>PV maximum<input className="field" type="number" min="1" value={maxHp} onChange={e=>setMaxHp(Number(e.target.value))}/></label>
  <label>PV temporaires<input className="field" type="number" min="0" value={tempHp} onChange={e=>setTempHp(Number(e.target.value))}/></label>
  <label>Inspiration <input type="checkbox" checked={inspiration} onChange={e=>setInspiration(e.target.checked)}/></label>
  <label>Capacités et traits<textarea className="field" value={features} onChange={e=>setFeatures(e.target.value)}/></label>
  <label>Notes de magie<textarea className="field" value={spellNotes} onChange={e=>setSpellNotes(e.target.value)}/></label>
  <label>Or restant<input className="field" type="number" min="0" value={gold} onChange={e=>setGold(Number(e.target.value))}/></label>
  <label>Notes<textarea className="field" value={notes} onChange={e=>setNotes(e.target.value)}/></label>
  <button className="btn outline" disabled={busy||!Number.isInteger(hp)||!Number.isInteger(maxHp)||!Number.isInteger(tempHp)||hp<0||maxHp<1||tempHp<0||gold<0||!Number.isFinite(gold)} onClick={()=>void save()}>Enregistrer la correction</button>
  {error&&<p className="notice error">{error}</p>}{done&&<p className="hint">Correction enregistrée.</p>}
 </section>;
}
