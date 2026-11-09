'use client';
import {useState} from 'react';
import {type Character,hitDice,fmt,abilities,mod} from '@/lib/rules';
import {planLevelUp,spellSlots2014,spellSaveDC,spellAttackBonus} from '@/lib/progression-2014';
import {newClassFeatures2014,featureReminderText2014} from '@/lib/class-features-2014';

type Props={character:Character;onSave:(changes:Partial<Character>)=>Promise<void>};
export default function LevelUp2014({character:c,onSave}:Props){
  const [mode,setMode]=useState<'average'|'roll'>('average');
  const [rolled,setRolled]=useState<number|null>(null);
  const [subclass,setSubclass]=useState('');
  const [asiChoice,setAsiChoice]=useState<'abilities'|'feat'>('abilities');
  const [asiFirst,setAsiFirst]=useState('FOR');
  const [asiSecond,setAsiSecond]=useState('FOR');
  const [featName,setFeatName]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const plan=planLevelUp(c,mode,rolled??undefined);
  const slots=spellSlots2014(c.class_name,c.level);
  const dc=spellSaveDC(c),attack=spellAttackBonus(c);
  async function levelUp(){
    if(!plan||busy)return;
    if(mode==='roll'&&rolled===null){setError('Lance le dé de vie avant de valider.');return}
    if(plan.requiresSubclass&&!subclass.trim()){setError('Choisis le nom de ta sous-classe avant de continuer.');return}
    const updatedAbilities={...c.abilities};
    let updatedFeats=c.feats??'';
    if(plan.offersASI){
      if(asiChoice==='feat'){
        if(!featName.trim()){setError('Renseigne le don choisi.');return}
        updatedFeats=[updatedFeats,featName.trim()].filter(Boolean).join('\n');
      }else{
        const first=asiFirst as keyof typeof updatedAbilities,second=asiSecond as keyof typeof updatedAbilities;
        if(!abilities.includes(first)||!abilities.includes(second)){setError('Caractéristique invalide.');return}
        updatedAbilities[first]+=1;updatedAbilities[second]+=1;
        if(Object.values(updatedAbilities).some(value=>value>20)){
          setError('Une amélioration de caractéristiques ne peut pas dépasser 20 (règle standard 2014).');return;
        }
      }
    }
    const conDifference=mod(updatedAbilities.CON)-mod(c.abilities.CON);
    // A changed Constitution modifier affects maximum HP retroactively, including the new level.
    const retroactiveHp=conDifference*plan.nextLevel;
    const totalHpGain=plan.hpGain+retroactiveHp;
    const reminders=featureReminderText2014(c.class_name,plan.nextLevel);
    const existingFeatures=c.features??'';
    const uniqueReminders=reminders.split('\n').filter(line=>line&&!existingFeatures.split('\n').includes(line));
    const updatedFeatures=[existingFeatures,...uniqueReminders].filter(Boolean).join('\n');
    if(!confirm(`Passer ${c.name} au niveau ${plan.nextLevel} (${totalHpGain>=0?'+':''}${totalHpGain} PV maximum) ?`))return;
    setBusy(true);setError('');
    try{await onSave({level:plan.nextLevel,features:updatedFeatures,hp_max:Math.max(1,c.hp_max+totalHpGain),hp_current:Math.max(0,c.hp_current+totalHpGain),...(plan.offersASI?{abilities:updatedAbilities,feats:updatedFeats}:{}),...(plan.requiresSubclass?{subclass:subclass.trim()}:{})});setRolled(null);setSubclass('')}
    catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  return <div className="panel full"><h2>Progression · D&D 5e 2014</h2>
    <p className="hint">Personnage monoclassé. Bonus de maîtrise et emplacements théoriques calculés automatiquement. Les ressources dépensées, capacités de classe, dons et sorts restent à renseigner manuellement.</p>
    {dc!==null&&<p>Magie : DD des sorts <strong>{dc}</strong> · Attaque de sort <strong>{fmt(attack??0)}</strong></p>}
    {slots.length>0&&<p>Emplacements au niveau {c.level} : {slots.map((n,i)=>n>0?`N${i+1} : ${n}`:null).filter(Boolean).join(' · ')} {c.class_name==='Occultiste'?'(magie de pacte)':''}</p>}
    {!plan?<p>Niveau maximal atteint (20).</p>:<>
      <h3>Passage au niveau {plan.nextLevel}</h3>
      <p>Bonus de maîtrise : {fmt(plan.proficiencyBonus)} · Dé de vie : d{hitDice[c.class_name]??8}</p>
      <label className="field-label">GAIN DE POINTS DE VIE</label>
      <select className="field" value={mode} onChange={e=>{setMode(e.target.value as 'average'|'roll');setRolled(null)}}><option value="average">Valeur fixe (moyenne arrondie au supérieur)</option><option value="roll">Lancer le dé de vie</option></select>
      {mode==='roll'&&<button type="button" className="btn outline" onClick={()=>setRolled(Math.floor(Math.random()*(hitDice[c.class_name]??8))+1)}>Lancer d{hitDice[c.class_name]??8}{rolled!==null?` : ${rolled}`:''}</button>}
      <p>Gain prévu : <strong>{mode==='roll'&&rolled===null?'En attente du lancer':`+${plan.hpGain} PV`}</strong> (minimum 1).</p>
      {plan.requiresSubclass&&<><label className="field-label">SOUS-CLASSE (CHOIX REQUIS)</label><input className="field" value={subclass} onChange={e=>setSubclass(e.target.value)} placeholder="Nom de la sous-classe choisie"/></>}
      {plan.offersASI&&<div className="notice">
        <h3>Amélioration de caractéristiques ou don</h3>
        <label className="field-label">TYPE DE CHOIX</label>
        <select className="field" value={asiChoice} onChange={e=>setAsiChoice(e.target.value as 'abilities'|'feat')}><option value="abilities">+2 points de caractéristiques (maximum 20)</option><option value="feat">Don (règle optionnelle, avec accord du MJ)</option></select>
        {asiChoice==='abilities'?<><p className="hint">Répartis deux points : deux fois +1 sur la même caractéristique, ou +1 sur deux caractéristiques différentes.</p>
          <label className="field-label">PREMIER POINT</label><select className="field" value={asiFirst} onChange={e=>setAsiFirst(e.target.value)}>{abilities.map(a=><option key={a} value={a}>{a} ({c.abilities[a]})</option>)}</select>
          <label className="field-label">DEUXIÈME POINT</label><select className="field" value={asiSecond} onChange={e=>setAsiSecond(e.target.value)}>{abilities.map(a=><option key={a} value={a}>{a} ({c.abilities[a]})</option>)}</select>
        </>:<><label className="field-label">NOM DU DON</label><input className="field" value={featName} onChange={e=>setFeatName(e.target.value)} placeholder="Don validé par le MJ"/><p className="hint">Les prérequis et les effets du don ne sont pas vérifiés automatiquement.</p></>}
      </div>}
      {newClassFeatures2014(c.class_name,plan.nextLevel).length>0&&<div className="notice"><h3>Capacités obtenues au niveau {plan.nextLevel}</h3><ul>{newClassFeatures2014(c.class_name,plan.nextLevel).map(feature=><li key={feature}>{feature}</li>)}</ul><p className="hint">Ces rappels seront ajoutés à la fiche. Les effets, choix de sous-classe et ressources restent à gérer manuellement.</p></div>}
      {plan.slots.length>0&&<p>Emplacements après progression : {plan.slots.map((n,i)=>n>0?`N${i+1} : ${n}`:null).filter(Boolean).join(' · ')}</p>}
      {error&&<p role="alert" className="notice error">{error}</p>}
      <button type="button" className="btn gold" disabled={busy||(mode==='roll'&&rolled===null)||(plan.requiresSubclass&&!subclass.trim())} onClick={levelUp}>{busy?'Enregistrement…':`Valider le niveau ${plan.nextLevel}`}</button>
    </>}
  </div>
}
