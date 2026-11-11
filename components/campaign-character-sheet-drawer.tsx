'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import CampaignBottomSheet from '@/components/campaign-bottom-sheet';
import { supabase } from '@/lib/supabase';
import type { Character } from '@/lib/rules';

const CharacterSheet = dynamic(() => import('@/components/character-sheet'), {
  loading: () => <p role="status">Chargement de la fiche…</p>,
});
type Vitals = { hp: number; max: number; temporary: number; conditions: string[] };

export default function CampaignCharacterSheetDrawer({ campaignId, character, onClose }: {
  campaignId: string; character: Character | null; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [vitals, setVitals] = useState<Vitals|null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!character) { dialog.current?.close(); return; }
    let live = true;
    let sequence = 0;
    setVitals(null); setError('');
    if (!dialog.current?.open) dialog.current?.showModal();
    const db = supabase();
    const load = async () => {
      const request = ++sequence;
      try {
        const { data, error } = await db.from('campaign_character_state').select('*')
          .eq('campaign_id', campaignId).eq('character_id', character.id).maybeSingle();
        if (!live || request !== sequence) return;
        if (error) throw error;
        setVitals({ hp: data?.hp_current ?? character.hp_current, max: data?.hp_max ?? character.hp_max,
          temporary: data?.hp_temporary ?? character.temporary_hp ?? 0, conditions: data?.conditions ?? [] });
        setError('');
      } catch { if (live && request === sequence) setError('Impossible de charger les ressources de la fiche.'); }
    };
    void load();
    const channel = db.channel(`full-sheet-${campaignId}-${character.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_character_state', filter: `campaign_id=eq.${campaignId}` }, () => void load()).subscribe();
    return () => { live = false; void db.removeChannel(channel); };
  }, [campaignId, character, refresh]);

  return <CampaignBottomSheet side dialogRef={dialog} title={`Fiche complète${character ? ' · ' + character.name : ''}`} onClose={onClose}>
    {error && <p role="alert" className="notice error">{error} <button className="btn outline" type="button" onClick={() => setRefresh(n => n + 1)}>Réessayer</button></p>}
    {character && !vitals && !error && <p role="status">Chargement des ressources…</p>}
    {character && vitals && <CharacterSheet key={character.id} id={character.id} campaignVitals={vitals}/>}
  </CampaignBottomSheet>;
}
