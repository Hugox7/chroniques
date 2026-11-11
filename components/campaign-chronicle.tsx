'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SessionSummaryEditor, { type SessionSummary } from '@/components/session-summary';
import { supabase } from '@/lib/supabase';

type Session = { id: string; started_at: string; ended_at: string|null };

export default function CampaignChronicle({ campaignId, title, isGM }: { campaignId: string; title: string; isGM: boolean }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [summaries, setSummaries] = useState<SessionSummary[]>([]);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const request = ++sequence.current;
    try {
      const db = supabase();
      const [sessions, summaries] = await Promise.all([
        db.from('game_sessions').select('id,started_at,ended_at').eq('campaign_id', campaignId).eq('status', 'completed').order('started_at'),
        db.from('session_summaries').select('*').eq('campaign_id', campaignId),
      ]);
      if (sessions.error || summaries.error) throw sessions.error ?? summaries.error;
      if (request !== sequence.current) return;
      setSessions(sessions.data ?? []); setSummaries(summaries.data ?? []); setError('');
    } catch { if (request === sequence.current) setError('Impossible de charger la chronique.'); }
  }, [campaignId]);

  useEffect(() => {
    void load();
    const db = supabase();
    const channel = db.channel('chronicle-' + campaignId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_summaries', filter: 'campaign_id=eq.' + campaignId }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: 'campaign_id=eq.' + campaignId }, () => void load()).subscribe();
    window.addEventListener('focus', load);
    return () => { sequence.current++; window.removeEventListener('focus', load); void db.removeChannel(channel); };
  }, [campaignId, load]);

  const completedIds = new Set(sessions.map(session => session.id));
  const reports = summaries.filter(summary => completedIds.has(summary.session_id));
  const measured = reports.filter(report => report.distance_km !== null);
  const distance = measured.reduce((sum, report) => sum + Number(report.distance_km), 0);
  const totalDistance = distance.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

  function exportChronicle() {
    const lines = [title, '', sessions.length + ' séances terminées',
      totalDistance + ' km renseignés · ' + measured.length + ' séances avec une distance', ''];
    sessions.forEach((session, index) => {
      const summary = reports.find(report => report.session_id === session.id);
      lines.push('Séance ' + (index + 1) + ' · ' + new Date(session.started_at).toLocaleDateString('fr-FR'), '');
      if (!summary) { lines.push('Résumé à compléter.', ''); return; }
      for (const [label, value] of [['Résumé', summary.summary], ['Lieux visités', summary.locations], ['Moments marquants', summary.highlights], ['Objectif accompli', summary.objective]]) {
        if (value) lines.push(label, value, '');
      }
      if (summary.distance_km !== null) lines.push('Distance parcourue · ' + summary.distance_km + ' km', '');
    });
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'chronique-de-campagne.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="panel campaign-chronicle">
    <span className="eyebrow">LA MÉMOIRE DE LA COMPAGNIE</span>
    <h2>Chronique de {title}</h2>
    <div className="chronicle-stats">
      <div><strong>{sessions.length}</strong><span>séances terminées</span></div>
      <div><strong>{totalDistance} km</strong><span>distance renseignée</span></div>
      <div><strong>{reports.filter(report => Boolean(report.objective.trim())).length}</strong><span>étapes racontées</span></div>
    </div>
    <p className="hint">{measured.length} séance(s) avec une distance renseignée sur {sessions.length}. Les distances laissées vides restent inconnues.</p>
    <button className="btn outline" type="button" disabled={!sessions.length} onClick={exportChronicle}>Exporter la chronique</button>
    {error && <p role="alert" className="notice error">{error}<button className="btn outline" type="button" onClick={() => void load()}>Actualiser la chronique</button></p>}
    {sessions.length === 0 && <p>La compagnie écrira sa première page à la fin d’une séance.</p>}
    <ol className="chronicle-timeline">{sessions.map((session, index) => {
      const summary = reports.find(report => report.session_id === session.id);
      return <li key={session.id}>
        <h3>Séance {index + 1} · {new Date(session.started_at).toLocaleDateString('fr-FR')}</h3>
        {summary ? <>
          {summary.summary && <p className="chronicle-text">{summary.summary}</p>}
          {summary.locations && <p className="chronicle-text"><strong>Lieux visités</strong><br/>{summary.locations}</p>}
          {summary.highlights && <p className="chronicle-text"><strong>Moments marquants</strong><br/>{summary.highlights}</p>}
          {summary.objective && <p className="chronicle-text"><strong>Étape accomplie</strong><br/>{summary.objective}</p>}
          {summary.distance_km !== null && <p>{Number(summary.distance_km).toLocaleString('fr-FR')} km parcourus</p>}
        </> : <p className="hint">Résumé à compléter.</p>}
        {isGM && <SessionSummaryEditor sessionId={session.id}/>}
      </li>;
    })}</ol>
  </section>;
}
