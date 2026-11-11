'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fmt, mod, roll, type Character } from '@/lib/rules';
import InitiativeScoreForm2014 from '@/components/initiative-score-form-2014';
import CampaignBestiary2014 from '@/components/campaign-bestiary-2014';
import type { BestiaryMonster2014 } from '@/lib/bestiary-2014';
import CampaignBottomSheet from '@/components/campaign-bottom-sheet';
import CampaignCharacterControl from '@/components/campaign-character-control';
import { supabase } from '@/lib/supabase';

type Entry = { id: string; name: string; score: number; hp_max?: number; hp_current?: number };
type Initiative = { entries: Entry[]; round: number; turn_index: number; version: number };
const empty: Initiative = { entries: [], round: 0, turn_index: 0, version: 0 };

export default function SessionInitiative2014({ sessionId, isGM, characters, campaignId, gmId, me = gmId, playerCharacterId }: {
  sessionId: string;
  isGM: boolean;
  characters: Character[];
  campaignId?: string;
  gmId?: string;
  me?: string;
  playerCharacterId?: string | null;
}) {
  const [state, setState] = useState<Initiative>(empty);
  const [characterId, setCharacterId] = useState('');
  const [name, setName] = useState('');
  const [score, setScore] = useState('');
  const [npcMaxHp, setNpcMaxHp] = useState('');
  const [selectedMonster, setSelectedMonster] = useState<BestiaryMonster2014|null>(null);
  const [npcHpInput, setNpcHpInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const addDialog = useRef<HTMLDialogElement>(null);
  const npcDialog = useRef<HTMLDialogElement>(null);
  const [npcId, setNpcId] = useState<string | null>(null);
  const request = useRef(0);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    const sequence = ++request.current;
    const { data, error } = await supabase().from('session_initiative_2014')
      .select('entries,round,turn_index,version').eq('session_id', sessionId).maybeSingle();
    if (sequence !== request.current) return;
    if (error) {
      setLoading(true);
      setError(error.message);
    } else {
      setState(data ?? empty);
      setLoading(false);
      setError('');
    }
  }, [sessionId]);

  useEffect(() => {
    const db = supabase();
    const refresh = () => { void load(); };
    refresh();
    const channel = db.channel(`initiative-2014-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_initiative_2014',
        filter: `session_id=eq.${sessionId}` }, refresh)
      .subscribe(status => { if (status === 'SUBSCRIBED') refresh(); });
    window.addEventListener('focus', refresh);
    return () => {
      request.current++;
      window.removeEventListener('focus', refresh);
      void db.removeChannel(channel);
    };
  }, [sessionId, load]);

  async function action(command: 'add' | 'remove' | 'edit_score' | 'npc_set_hp' | 'npc_adjust_hp' | 'start' | 'next' | 'finish', fields = {}) {
    if (!isGM || loading || inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const { error } = await supabase().rpc('update_session_initiative_2014', {
        p_session: sessionId, p_version: state.version, p_action: command, ...fields,
      });
      await load();
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Impossible de modifier l’initiative.');
      return false;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const available = characters.filter(character => !state.entries.some(entry => entry.id === character.id));
  const selected = available.find(character => character.id === characterId);
  const validHp = (value: string) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 9999;
  const canAdd = selected || (!characterId && name.trim() && (!npcMaxHp.trim() || validHp(npcMaxHp)));
  const dexterity = selected?.abilities.DEX ?? selectedMonster?.dexterity;
  const numericScore = Number(score);
  const validScore = score.trim() !== '' && Number.isInteger(numericScore) && numericScore >= -100 && numericScore <= 100;
  const running = state.round > 0;
  const current = running ? state.entries[state.turn_index] : undefined;

  function openCombatPreparation(id = '', monster: BestiaryMonster2014|null = null) {
    if (busy || loading || running) return;
    setCharacterId(id);
    setSelectedMonster(monster);
    setName(monster?.nameFr ?? '');
    setScore('');
    setNpcMaxHp(monster ? String(monster.hitPoints) : '');
    addDialog.current?.showModal();
  }

  const startButton = <button className="btn gold" type="button" disabled={busy || loading || !state.entries.length}
    onClick={() => void action('start')}>Commencer le round 1</button>;

  const addForm = <form className="hp-actions mj-add-form" onSubmit={async event => {
        event.preventDefault();
        if (!validScore || !canAdd) return;
        if (await action('add', { p_character: selected?.id, p_name: selected ? undefined : name.trim(), p_score: numericScore,
          ...(!selected && npcMaxHp.trim() ? { p_npc_hp: Number(npcMaxHp) } : {}) })) {
          setCharacterId(''); setName(''); setScore(''); setNpcMaxHp(''); setSelectedMonster(null);
          addDialog.current?.close();
        }
      }}>
        <label>Combattant <select className="field" value={characterId} onChange={event => {
          setCharacterId(event.target.value); setScore(''); setNpcMaxHp(''); setName(''); setSelectedMonster(null);
        }}>
          <option value="">Créature ou PNJ</option>
          {available.map(character => <option key={character.id} value={character.id}>{character.name}</option>)}
        </select></label>
        {selectedMonster && <p className="hint">{selectedMonster.nameFr} · CA {selectedMonster.armorClass} · {selectedMonster.hitPoints} PV de référence</p>}
        {!characterId && <>
          <label>Nom de la créature ou du PNJ <input className="field" value={name} required maxLength={120}
            onChange={event => setName(event.target.value)}/></label>
          <label>PV maximum (facultatif) <input className="field" type="number" min={1} max={9999} value={npcMaxHp}
            onChange={event => setNpcMaxHp(event.target.value)}/></label>
        </>}
        <label>Résultat d’initiative <input className="field" type="number" min={-100} max={100} required value={score}
          onChange={event => setScore(event.target.value)}/></label>
        {dexterity !== undefined && <button className="btn outline" type="button" disabled={busy}
          onClick={() => setScore(String(roll(20) + mod(dexterity)))}>
          Lancer le d20 d’initiative ({fmt(mod(dexterity))} DEX)
        </button>}
        <button className="btn outline" type="submit" disabled={busy || !validScore || !canAdd}>Ajouter à l’initiative</button>
      </form>;
  if (campaignId && me) {
    const ordered = running ? state.entries : [...state.entries].sort((left, right) => right.score - left.score);
    const rows = [
      ...ordered.map((entry, index) => ({
        id: entry.id, entry, character: characters.find(item => item.id === entry.id),
        rank: index + 1,
      })),
      ...available.map(character => ({ id: character.id, character, entry: undefined, rank: undefined })),
    ];
    const npc = ordered.find(entry => entry.id === npcId);
    return <section className="mj-initiative" aria-label="Initiative">
      <div className="mj-initiative-heading">
        <div>
          <h2>Initiative</h2>
          {current && <p role="status">Round {state.round} · {current.name}</p>}
        </div>
        {isGM && <div className="hp-actions">
          <CampaignBestiary2014 key={campaignId} campaignId={campaignId}
            onSelect={running || loading ? undefined : monster => openCombatPreparation('', monster)}/>
          {running
            ? <button type="button" className="btn gold" disabled={busy || loading} onClick={() => void action('next')}>Tour suivant</button>
            : <>
              <button type="button" className="btn outline" disabled={busy || loading} onClick={() => openCombatPreparation()}>+ Combattant</button>
              {startButton}
            </>}
        </div>}
      </div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {loading && <button type="button" className="btn outline" onClick={() => void load()}>Actualiser</button>}
      {rows.length > 0 && <p className="mj-muted">{isGM && !running
        ? 'Utilise Jet d’initiative sur un personnage, ou + Combattant pour une créature ou un PNJ.'
        : 'Lance le jet depuis l’attaquant. Pour des dégâts ou des soins déjà connus, modifie les PV de la cible.'}</p>}
      {!rows.length && !loading && <p className="mj-muted">{isGM ? 'Ajoute un combattant pour préparer le combat.' : 'Le MJ prépare le combat.'}</p>}
      {rows.length > 0 && <ul className="mj-roster">
        {rows.map(({ id, character, entry, rank }) => <li key={id}>
          {character
            ? <CampaignCharacterControl campaignId={campaignId} character={character} me={me} canEdit={isGM || id === playerCharacterId} isGM={isGM}
                damageTargets={isGM?characters:undefined}
                initiative={{ rank, score: entry?.score, active: current?.id === id }}
                onAddInitiative={isGM && !entry && !running ? () => openCombatPreparation(id) : undefined}
                onEditScore={isGM && entry && !running ? score => action('edit_score', { p_entry: id, p_score: score }) : undefined}
                onRemove={isGM && entry && !running ? () => action('remove', { p_entry: id }) : undefined}/>
            : entry && <button type="button" className="mj-combatant" aria-current={current?.id === id ? 'step' : undefined}
                aria-label={isGM ? `Modifier les PV de ${entry.name}` : `Voir ${entry.name}`}
                onClick={() => { setNpcId(id); setNpcHpInput(''); npcDialog.current?.showModal(); }}>
                <span className="mj-combatant-rank">{rank}</span>
                <span className="mj-combatant-name"><strong>{entry.name}</strong><small>Initiative {entry.score} · Créature ou PNJ</small></span>
                <span className="mj-combatant-hp">{entry.hp_max === undefined ? 'PV —' : `${entry.hp_current}/${entry.hp_max} PV`}</span>
                <span className="mj-combatant-ac">{isGM ? 'Modifier les PV' : ''}</span>
              </button>}
        </li>)}
      </ul>}
      {isGM && running && <details className="mj-disclosure"><summary>Options du combat</summary>
        <button type="button" className="btn outline mj-risk" disabled={busy || loading} onClick={() => {
          if (window.confirm('Terminer le combat et vider son ordre d’initiative ?')) void action('finish');
        }}>Terminer le combat</button>
      </details>}
      {isGM && <CampaignBottomSheet centered dialogRef={addDialog} title="Ajouter un combattant">
        <p className="mj-muted">À score égal, l’ordre d’ajout départage les combattants.</p>
        {error && <p role="alert" className="notice error">{error}</p>}
        {addForm}
      </CampaignBottomSheet>}
      <CampaignBottomSheet centered dialogRef={npcDialog} title={npc?.name ?? 'Créature ou PNJ'}>
        {npc && <p>Initiative {npc.score}</p>}
        {npc?.hp_max !== undefined && <p role="status">{npc.hp_current} / {npc.hp_max} PV</p>}
        {isGM && npc && <div className="hp-actions">
          <label>{npc.hp_max === undefined ? 'PV maximum' : 'Quantité'}
            <input className="field" type="number" min={1} max={9999} value={npcHpInput} disabled={busy}
              onChange={event => setNpcHpInput(event.target.value)}/>
          </label>
          {npc.hp_max === undefined
            ? <button className="btn outline" type="button" disabled={busy || loading || !validHp(npcHpInput)}
                onClick={async () => {
                  if (await action('npc_set_hp', { p_entry: npc.id, p_npc_hp: Number(npcHpInput) })) setNpcHpInput('');
                }}>Enregistrer les PV</button>
            : <>
              <button className="btn outline" type="button" disabled={busy || loading || !validHp(npcHpInput) || npc.hp_current === 0}
                onClick={async () => {
                  if (await action('npc_adjust_hp', { p_entry: npc.id, p_npc_hp: -Number(npcHpInput) })) setNpcHpInput('');
                }}>Appliquer les dégâts</button>
              <button className="btn outline" type="button" disabled={busy || loading || !validHp(npcHpInput) || npc.hp_current === npc.hp_max}
                onClick={async () => {
                  if (await action('npc_adjust_hp', { p_entry: npc.id, p_npc_hp: Number(npcHpInput) })) setNpcHpInput('');
                }}>Soigner</button>
            </>}
        </div>}
        {npc && npc.hp_max === undefined && !isGM && <p className="mj-muted">PV non renseignés.</p>}
        {error && <p role="alert" className="notice error">{error}</p>}
        {isGM && npc && !running && <InitiativeScoreForm2014 key={`${npc.id}-${npc.score}`} score={npc.score}
          onSave={score => action('edit_score', { p_entry: npc.id, p_score: score })}/>}
        {isGM && npc && !running && <button type="button" className="btn outline mj-risk" disabled={busy || loading}
          onClick={async () => {
            if (window.confirm(`Retirer ${npc.name} de l’initiative ?`) &&
              await action('remove', { p_entry: npc.id })) npcDialog.current?.close();
          }}>Retirer de l’initiative</button>}
      </CampaignBottomSheet>
    </section>;
  }

  return <section className="panel" id="campaign-initiative" aria-label="Initiative et tours">
    <h3>Initiative et tours</h3>
    {error && <p className="notice error" role="alert">{error}</p>}
    {loading && <button className="btn outline" type="button" onClick={() => void load()}>Actualiser l’initiative</button>}
    {current && <p role="status"><strong>Round {state.round} · Au tour de {current.name}</strong></p>}
    {!current && !loading && <p className="hint">{isGM
      ? 'Ajoute les combattants dans l’ordre souhaité en cas d’égalité, puis lance le combat.'
      : 'Le MJ prépare l’ordre de combat.'}</p>}
    {state.entries.length > 0 && <ol>
      {state.entries.map(entry => <li key={entry.id} aria-current={current?.id === entry.id ? 'step' : undefined}>
        {current?.id === entry.id ? <strong>{entry.name} · {entry.score}</strong> : <span>{entry.name} · {entry.score}</span>}
        {isGM && !running && <button className="btn outline" type="button" aria-label={`Retirer ${entry.name}`}
          disabled={busy || loading} onClick={() => void action('remove', { p_entry: entry.id })}>Retirer</button>}
      </li>)}
    </ol>}
    {isGM && !loading && (running ? <div className="hp-actions">
      <button className="btn gold" type="button" disabled={busy} onClick={() => void action('next')}>Tour suivant</button>
      <button className="btn outline" type="button" disabled={busy} onClick={() => {
        if (confirm('Terminer le combat et vider son ordre d’initiative ?')) void action('finish');
      }}>Terminer le combat</button>
    </div> : <>
      {addForm}
      {startButton}
    </>)}
  </section>;
}
