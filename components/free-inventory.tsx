'use client';

import { useRef, useState } from 'react';
import type { Character, DefenseEquipment2014, InventoryItem2014 } from '@/lib/rules';
import {
  armorCatalog2014, equippedArmorClass2014, itemDefense2014, normalizeInventory2014,
  validDefense2014,
} from '@/lib/armor-class-2014';

export default function FreeInventory({ character, onSave, locked = false }: {
  character: Character;
  onSave: (changes: Partial<Character>) => Promise<void>;
  locked?: boolean;
}) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [catalogId, setCatalogId] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [defense, setDefense] = useState<DefenseEquipment2014>({ kind: 'armor', base: 12, dexterity: 'full' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const items = normalizeInventory2014(character.inventory);
  const ac = equippedArmorClass2014(character);

  async function persist(next: InventoryItem2014[]) {
    if (locked || saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      await onSave({ inventory: next });
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Enregistrement impossible.');
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  function updateItem(item: InventoryItem2014) {
    const kind = item.equipped ? itemDefense2014(item)?.kind : undefined;
    return persist(items.map(other => {
      if (other.id === item.id) return item;
      return kind && itemDefense2014(other)?.kind === kind && other.equipped
        ? { ...other, equipped: false } : other;
    }));
  }

  return <div className="panel full">
    <h2>Inventaire libre</h2>
    <p><strong>CA d’équipement {ac.total}</strong> · {[ac.armor ?? 'Sans armure', ac.shield].filter(Boolean).join(' + ')}</p>
    <p className="hint">{locked
      ? 'Les règles de la campagne verrouillent les modifications de cet inventaire.'
      : 'Une armure et un bouclier peuvent être équipés. Ajoute des protections du SRD ou définis les paramètres de tes propres objets.'}</p>
    {error && <p role="alert" className="notice error">{error}</p>}
    {items.length === 0 && <p className="muted">Ton sac est vide pour le moment.</p>}
    {items.map(item => {
      const protection = itemDefense2014(item);
      return <div key={item.id} className="member" style={{ gap: 12, flexWrap: 'wrap' }}>
        <strong style={{ flex: 1, minWidth: 140 }}>{item.name}{item.equipped && protection && item.quantity > 0 ? ' · Équipé' : ''}</strong>
        <label>Quantité <input className="field" aria-label={`Quantité de ${item.name}`} type="number" min="0" max="999999"
          style={{ width: 90 }} value={item.quantity} disabled={locked || busy} onChange={e => {
            const n = Number(e.target.value);
            if (Number.isInteger(n) && n >= 0 && n <= 999999) void updateItem({ ...item, quantity: n, equipped: n > 0 && item.equipped });
          }}/></label>
        {!locked && <>
          {protection && <button type="button" className="btn outline" disabled={busy || item.quantity <= 0}
            onClick={() => void updateItem({ ...item, equipped: !item.equipped })}>{item.equipped ? 'Déséquiper' : 'Équiper'}</button>}
          <button type="button" className="btn outline" disabled={busy} onClick={() => {
            setDefense(protection ?? { kind: 'armor', base: 12, dexterity: 'full' });
            setEditing(item.id);
          }}>Paramètres de CA</button>
          <button type="button" className="btn outline" disabled={busy} onClick={() => {
            if (confirm(`Retirer « ${item.name} » de l’inventaire ?`)) void persist(items.filter(other => other.id !== item.id));
          }}>Retirer</button>
          {editing === item.id && <form style={{ width: '100%' }} onSubmit={async e => {
            e.preventDefault();
            if (validDefense2014(defense) && await updateItem({
              ...item, defense, equipped: item.equipped && protection?.kind === defense.kind,
            })) setEditing(null);
          }}>
            <fieldset disabled={busy}>
              <legend>Protection de {item.name}</legend>
              <label>Type de protection <select className="field" value={defense.kind} onChange={e => setDefense(e.target.value === 'shield'
                ? { kind: 'shield', bonus: 2 } : { kind: 'armor', base: 12, dexterity: 'full' })}>
                <option value="armor">Armure</option><option value="shield">Bouclier</option>
              </select></label>
              {defense.kind === 'shield'
                ? <label>Bonus de CA <input className="field" required type="number" min={0} max={30}
                    value={Number.isNaN(defense.bonus) ? '' : defense.bonus} onChange={e => setDefense({ ...defense, bonus: e.target.valueAsNumber })}/></label>
                : <>
                  <label>CA de base <input className="field" required type="number" min={1} max={40}
                    value={Number.isNaN(defense.base) ? '' : defense.base} onChange={e => setDefense({ ...defense, base: e.target.valueAsNumber })}/></label>
                  <label>Modificateur de Dextérité <select className="field" value={defense.dexterity} onChange={e =>
                    setDefense({ ...defense, dexterity: e.target.value as typeof defense.dexterity, dexterityCap: 2 })}>
                    <option value="none">Ignoré</option><option value="full">Intégral</option><option value="capped">Plafonné</option>
                  </select></label>
                  {defense.dexterity === 'capped' && <label>Plafond de Dextérité <input className="field" required type="number" min={0} max={10}
                    value={Number.isNaN(defense.dexterityCap) ? '' : defense.dexterityCap ?? 2} onChange={e => setDefense({ ...defense, dexterityCap: e.target.valueAsNumber })}/></label>}
                </>}
              <button className="btn gold" type="submit">Enregistrer la protection</button>
              <button className="btn outline" type="button" onClick={() => setEditing(null)}>Annuler</button>
              {item.defense && <button className="btn outline" type="button" onClick={async () => {
                if (await updateItem({ ...item, defense: undefined, equipped: false })) setEditing(null);
              }}>Rétablir les paramètres par défaut</button>}
            </fieldset>
          </form>}
        </>}
      </div>;
    })}
    {!locked && <>
      <form className="hp-actions" onSubmit={async e => {
        e.preventDefault();
        if (!name.trim() || !Number.isInteger(quantity) || quantity < 0 || quantity > 999999) return;
        if (await persist([...items, { id: crypto.randomUUID(), name: name.trim(), quantity }])) {
          setName(''); setQuantity(1);
        }
      }}>
        <label>Nom de l’objet <input className="field" maxLength={120} required value={name} onChange={e => setName(e.target.value)}/></label>
        <label>Quantité initiale <input className="field" type="number" required min="0" max="999999" value={quantity}
          onChange={e => setQuantity(e.target.valueAsNumber || 0)}/></label>
        <button className="btn gold" disabled={busy} type="submit">Ajouter un objet libre</button>
      </form>
      <form className="hp-actions" onSubmit={async e => {
        e.preventDefault();
        const entry = armorCatalog2014.find(option => option.id === catalogId);
        if (entry && await persist([...items, { id: crypto.randomUUID(), name: entry.name, quantity: 1, defense: entry.defense }])) setCatalogId('');
      }}>
        <label>Protection SRD 2014 <select className="field" value={catalogId} onChange={e => setCatalogId(e.target.value)}>
          <option value="">Choisir une armure ou un bouclier</option>
          {armorCatalog2014.map(entry => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select></label>
        <button className="btn outline" disabled={busy || !catalogId} type="submit">Ajouter la protection</button>
      </form>
    </>}
  </div>;
}
