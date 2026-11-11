'use client';

import { useState } from 'react';

export default function InitiativeScoreForm2014({ score, onSave }: {
  score: number;
  onSave: (score: number) => Promise<boolean>;
}) {
  const [value, setValue] = useState(String(score));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const next = Number(value);
  const valid = value.trim() && Number.isInteger(next) && next >= -100 && next <= 100;

  return <form className="hp-actions" onSubmit={async event => {
    event.preventDefault();
    if (!valid || saving || next === score) return;
    setSaving(true);
    setError('');
    try {
      if (!await onSave(next)) setError('Score non enregistré. Réessaie après actualisation.');
    } finally {
      setSaving(false);
    }
  }}>
    <label>Score d’initiative <input className="field" type="number" min={-100} max={100} required
      value={value} disabled={saving} onChange={event => setValue(event.target.value)} /></label>
    <button type="submit" className="btn outline" disabled={!valid || saving || next === score}>Enregistrer le score</button>
    {error && <p role="alert" className="notice error">{error}</p>}
  </form>;
}
