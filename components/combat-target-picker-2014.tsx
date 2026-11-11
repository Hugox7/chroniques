'use client';

import { useState } from 'react';
import { searchBestiary2014 } from '@/lib/bestiary-2014';

export type CombatTarget2014 = {
  name: string;
  armorClass: number;
  fiendOrUndead: boolean;
  hitPoints?: number;
};

export default function CombatTargetPicker2014({ onSelect }: {
  onSelect: (target: CombatTarget2014) => void;
}) {
  const [search, setSearch] = useState('');
  const [monsterId, setMonsterId] = useState('');
  const [name, setName] = useState('');
  const [armorClass, setArmorClass] = useState('');
  const [fiendOrUndead, setFiendOrUndead] = useState(false);
  const matches = searchBestiary2014(search);
  const monster = matches.find(entry => entry.id === monsterId);
  const ac = Number(armorClass);
  const validCustom = name.trim() && Number.isInteger(ac) && ac >= 1 && ac <= 40;

  return <div className="panel">
    <h4>Bestiaire SRD 2014</h4>
    <label>Rechercher une créature <input className="field" type="search" value={search}
      onChange={event => { setSearch(event.target.value); setMonsterId(''); }}/></label>
    <label>Créature <select className="field" value={monsterId} onChange={event => setMonsterId(event.target.value)}>
      <option value="">Sélectionner une créature</option>
      {matches.map(entry => <option key={entry.id} value={entry.id}>{entry.nameFr}{entry.nameFr !== entry.name ? ` · ${entry.name}` : ""}</option>)}
    </select></label>
    {matches.length === 0 && <p className="hint">Aucune créature trouvée.</p>}
    {monster && <div className="hp-actions">
      <span>{monster.type} · CA {monster.armorClass} · {monster.hitPoints} PV de référence</span>
      <button className="btn outline" type="button" onClick={() => onSelect({ ...monster, name: monster.nameFr })}>Utiliser cette créature</button>
    </div>}
    <form className="hp-actions" onSubmit={event => {
      event.preventDefault();
      if (validCustom) onSelect({ name: name.trim(), armorClass: ac, fiendOrUndead });
    }}>
      <label>Nom de la cible personnalisée <input className="field" value={name} required maxLength={120}
        onChange={event => setName(event.target.value)}/></label>
      <label>CA personnalisée <input className="field" type="number" min={1} max={40} required value={armorClass}
        onChange={event => setArmorClass(event.target.value)}/></label>
      <label><input type="checkbox" checked={fiendOrUndead} onChange={event => setFiendOrUndead(event.target.checked)}/>
        Fiélon ou mort-vivant</label>
      <button className="btn outline" type="submit" disabled={!validCustom}>Utiliser la cible personnalisée</button>
    </form>
  </div>;
}
