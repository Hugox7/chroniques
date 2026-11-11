'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { BookOpen, Bug, Flame, PawPrint, Skull, Star, Swords } from 'lucide-react';
import CampaignBottomSheet from '@/components/campaign-bottom-sheet';
import { searchBestiary2014, type BestiaryMonster2014 } from '@/lib/bestiary-2014';
import { supabase } from '@/lib/supabase';

const icons = { Beast: PawPrint, Dragon: Flame, Undead: Skull, Aberration: Bug, Humanoid: Swords };
// D&D 5e API gives separate identifiers to the vampire and lycanthrope forms.
const imageAliases: Record<string, string> = {
  succubusincubus: 'succubus-incubus',
  vampire: 'vampire-vampire',
  werebear: 'werebear-hybrid',
  wereboar: 'wereboar-hybrid',
  wererat: 'wererat-hybrid',
  weretiger: 'weretiger-hybrid',
  werewolf: 'werewolf-hybrid',
};

function creatureImageUrl(id: string) {
  return `https://www.dnd5eapi.co/api/images/monsters/${imageAliases[id] ?? id}.png`;
}

function CreaturePortrait({ monster, eager = false, onPreview }: {
  monster: BestiaryMonster2014;
  eager?: boolean;
  onPreview?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [source, setSource] = useState<'optimized'|'direct'|'unavailable'>('optimized');
  const Icon = icons[monster.type as keyof typeof icons] ?? Bug;
  const size = onPreview ? 64 : 384;
  const frame = <span className="mj-bestiary-portrait" aria-hidden="true">
    {!loaded && <Icon size={26}/>}
    {source !== 'unavailable' && <Image key={source} src={creatureImageUrl(monster.id)} alt=""
      width={size} height={size} unoptimized={source === 'direct'}
      loading={eager ? 'eager' : 'lazy'} decoding="async"
      onLoad={() => setLoaded(true)} onError={() => {
        setLoaded(false);
        setSource(source === 'optimized' ? 'direct' : 'unavailable');
      }}/>}
  </span>;
  return onPreview
    ? <button type="button" className="mj-bestiary-portrait-button" aria-haspopup="dialog"
        aria-label={`Voir l’illustration de ${monster.nameFr}`}
        onClick={onPreview}>{frame}</button>
    : frame;
}
export default function CampaignBestiary2014({ campaignId, onSelect }: {
  campaignId: string;
  onSelect?: (monster: BestiaryMonster2014) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewRef = useRef<HTMLDialogElement>(null);
  const [preview, setPreview] = useState<BestiaryMonster2014|null>(null);
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(24);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const writeLock = useRef(false);

  useEffect(() => {
    if (!open) return;
    let live = true;
    setReady(false);
    setError('');
    void (async () => {
      try {
        const { data, error } = await supabase().from('campaign_bestiary_favorites')
          .select('monster_id').eq('campaign_id', campaignId);
        if (!live) return;
        if (error) throw error;
        setFavorites((data ?? []).map(row => row.monster_id));
        setReady(true);
      } catch {
        if (live) setError('Impossible de charger les favoris de la campagne.');
      }
    })();
    return () => { live = false; };
  }, [campaignId, open]);

  async function toggleFavorite(id: string) {
    if (!ready || writeLock.current) return;
    writeLock.current = true;
    setSaving(true);
    setError('');
    const table = supabase().from('campaign_bestiary_favorites');
    const wasFavorite = favorites.includes(id);
    try {
      const { error } = wasFavorite
        ? await table.delete().eq('campaign_id', campaignId).eq('monster_id', id)
        : await table.insert({ campaign_id: campaignId, monster_id: id });
      if (error && (wasFavorite || error.code !== '23505')) throw error;
      setFavorites(previous => wasFavorite ? previous.filter(value => value !== id) : [...previous, id]);
    } catch {
      setError('Impossible de modifier ce favori. Réessaie.');
    } finally {
      writeLock.current = false;
      setSaving(false);
    }
  }

  const matches = open
    ? searchBestiary2014(search).filter(monster => !favoritesOnly || favorites.includes(monster.id))
    : [];

  return <>
    <button type="button" className="btn outline" aria-haspopup="dialog" onClick={() => {
      setReady(false);
      setOpen(true);
      dialogRef.current?.showModal();
    }}><BookOpen size={16} aria-hidden="true"/> Bestiaire</button>
    <CampaignBottomSheet side dialogRef={dialogRef} title="Bestiaire · SRD 2014" onClose={() => setOpen(false)}>
      {open && <>
        <div className="hp-actions">
          <label htmlFor={searchId}>Rechercher une créature
            <input id={searchId} className="field" type="search" value={search} onChange={event => {
              setSearch(event.target.value); setShown(24);
            }}/>
          </label>
          <button type="button" className="btn outline" aria-pressed={favoritesOnly}
            disabled={!ready} onClick={() => { setFavoritesOnly(value => !value); setShown(24); }}>Favoris de la campagne</button>
        </div>
        <p className="hint">{onSelect
          ? 'Choisis une créature pour préremplir son nom et ses PV de référence.'
          : 'Tu peux préparer tes favoris. Pour ajouter une créature, ouvre une séance et prépare l’initiative.'}</p>
        {error && <p role="alert" className="notice error">{error}</p>}
        <p className="hint" role="status">{matches.length} créature(s)</p>
        <ul className="mj-bestiary-list">
          {matches.slice(0, shown).map((monster, index) => {
            const favorite = favorites.includes(monster.id);

            return <li key={monster.id} className="mj-bestiary-card">
              <CreaturePortrait monster={monster} eager={index < 6} onPreview={() => {
                setPreview(monster);
                previewRef.current?.showModal();
              }}/>
              <div>
                <strong>{monster.nameFr}</strong>
                {monster.nameFr !== monster.name && <div className="hint" lang="en">{monster.name}</div>}
                <div className="hint">{monster.type} · FP {monster.challengeRating}</div>
                <div><strong>{monster.hitPoints} PV</strong> de référence · CA {monster.armorClass}</div>
              </div>
              <div className="hp-actions">
                <button type="button" className="btn outline" aria-pressed={favorite}
                  aria-label={`Favori · ${monster.nameFr}`} disabled={!ready || saving}
                  onClick={() => void toggleFavorite(monster.id)}>
                  <Star size={17} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true"/>
                </button>
                {onSelect && <button type="button" className="btn outline"
                  aria-label={`Préparer ${monster.nameFr} pour l’initiative`} onClick={() => {
                    dialogRef.current?.close();
                    onSelect(monster);
                  }}>Préparer</button>}
              </div>
            </li>;
          })}
        </ul>
        {matches.length > shown && <button type="button" className="btn outline" onClick={() => setShown(value => value + 24)}>Voir plus de créatures</button>}
        <p className="hint">Statistiques via Open5e. Noms français issus du SRD 5.1.
          Illustrations chargées depuis <a href="https://www.dnd5eapi.co/" target="_blank" rel="noreferrer">D&amp;D 5e API</a>.</p>
        <details>
          <summary>Attribution du SRD 5.1</summary>
          <p className="hint">Ce travail comprend la documentation tirée du Document de Référence du Système 5.1
            (« SRD 5.1 ») par Wizards of the Coast LLC et disponible à l’adresse{' '}
            <a href="https://dnd.wizards.com/fr/resources/systems-reference-document">dnd.wizards.com/fr/resources/systems-reference-document</a>.
            Le SRD 5.1 est distribué en vertu de la licence{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/legalcode.fr">Creative Commons Attribution 4.0 International</a>.
          </p>
        </details>
      </>}
    </CampaignBottomSheet>
    <CampaignBottomSheet centered dialogRef={previewRef} title={preview?.nameFr ?? 'Illustration'}
      onClose={() => setPreview(null)}>
      {preview && <figure className="mj-bestiary-preview">
        <CreaturePortrait key={preview.id} monster={preview} eager/>
        <figcaption className="hint">
          <a href={creatureImageUrl(preview.id)} target="_blank" rel="noreferrer">Voir l’image source sur D&amp;D 5e API</a>
        </figcaption>
      </figure>}
    </CampaignBottomSheet>
  </>;
}
