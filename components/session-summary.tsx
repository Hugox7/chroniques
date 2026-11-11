'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CampaignBottomSheet from '@/components/campaign-bottom-sheet';
import { supabase } from '@/lib/supabase';

export type SessionSummary = {
  session_id: string; campaign_id: string; summary: string; locations: string;
  highlights: string; objective: string; distance_km: number|null; version: number;
};

const blank = { summary: '', locations: '', highlights: '', objective: '', distance: '', version: 0 };

export default function SessionSummaryEditor({ sessionId, autoOpen = false, onClose }: {
  sessionId: string; autoOpen?: boolean; onClose?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(blank);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const lock = useRef(false);
  const sequence = useRef(0);

  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setError('');
    try {
      const { data, error } = await supabase().from('session_summaries').select('*').eq('session_id', sessionId).maybeSingle();
      if (error) throw error;
      if (request !== sequence.current) return;
      setDraft(data ? { ...data, distance: data.distance_km === null ? '' : String(data.distance_km) } : blank);
      setLoading(false);
    } catch { if (request === sequence.current) setError('Impossible de charger le résumé. Ferme le formulaire et réessaie.'); }
  }, [sessionId]);

  useEffect(() => {
    if (autoOpen) { dialog.current?.showModal(); setOpen(true); }
  }, [autoOpen]);
  useEffect(() => { if (open) void load(); return () => { sequence.current++; }; }, [open, load]);

  const distance = draft.distance.trim() === '' ? null : Number(draft.distance.replace(',', '.'));
  const validDistance = distance === null || (/^\d{1,8}([.,]\d{1,2})?$/.test(draft.distance.trim()) && distance <= 10_000_000);

  return <>
    {!autoOpen && <button type="button" className="btn outline" onClick={() => { dialog.current?.showModal(); setOpen(true); }}>Résumé de séance</button>}
    <CampaignBottomSheet centered dialogRef={dialog} title="La chronique de cette séance" onClose={() => { setOpen(false); onClose?.(); }}>
      <p className="hint">Ce résumé sera visible par la compagnie. Tu pourras le compléter plus tard dans Journal → Bilans de séance.</p>
      {error && <p role="alert" className="notice error">{error}</p>}
      <form onSubmit={async event => {
        event.preventDefault();
        if (loading || lock.current || !validDistance) return;
        lock.current = true; setBusy(true); setError('');
        try {
          const { error } = await supabase().rpc('save_session_summary', { p_session: sessionId, p_version: draft.version,
            p_data: { summary: draft.summary, locations: draft.locations, highlights: draft.highlights, objective: draft.objective, distance_km: distance } });
          if (error) throw error;
          dialog.current?.close();
        } catch (error) { setError((error as Error).message); }
        finally { lock.current = false; setBusy(false); }
      }}>
        <fieldset disabled={loading || busy} className="economy-fieldset economy-form">
          <label>Résumé<textarea className="field" rows={3} maxLength={4000} value={draft.summary} onChange={e => setDraft({ ...draft, summary: e.target.value })}/></label>
          <label>Lieux visités<textarea className="field" rows={2} maxLength={2000} value={draft.locations} onChange={e => setDraft({ ...draft, locations: e.target.value })}/></label>
          <label>Distance parcourue en km<input className="field" inputMode="decimal" placeholder="Facultatif" value={draft.distance} onChange={e => setDraft({ ...draft, distance: e.target.value })}/></label>
          <label>Moments marquants<textarea className="field" rows={3} maxLength={4000} value={draft.highlights} onChange={e => setDraft({ ...draft, highlights: e.target.value })}/></label>
          <label>Objectif ou étape accomplie<textarea className="field" rows={2} maxLength={1000} value={draft.objective} onChange={e => setDraft({ ...draft, objective: e.target.value })}/></label>
          <button className="btn gold" disabled={!validDistance}>Enregistrer le résumé</button>
        </fieldset>
        {loading && !error && <p role="status">Chargement du résumé…</p>}
      </form>
      <button type="button" className="btn outline" disabled={busy} onClick={() => dialog.current?.close()}>Passer pour l’instant</button>
    </CampaignBottomSheet>
  </>;
}
