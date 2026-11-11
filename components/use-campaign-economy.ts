'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Character } from '@/lib/rules';
import type { Shop, Stock, TradeEvent, Vault, VaultItem } from '@/lib/campaign-economy';

type Command = { action: string; data: Record<string, unknown>; request: string; campaign: string };

export default function useCampaignEconomy(campaignId: string) {
  const [vault, setVault] = useState<Vault>({ campaign_id: campaignId, balance_cp: 0, location: '', version: 0 });
  const [items, setItems] = useState<VaultItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [people, setPeople] = useState<Character[]>([]);
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const lock = useRef(false);
  const pending = useRef<Command|null>(null);
  const sequence = useRef(0);
  const currentCampaign = useRef(campaignId);
  currentCampaign.current = campaignId;

  const load = useCallback(async () => {
    const request = ++sequence.current;
    const db = supabase();
    try {
      const [v, i, s, e, members] = await Promise.all([
        db.from('campaign_vaults').select('*').eq('campaign_id', campaignId).maybeSingle(),
        db.from('campaign_vault_items').select('*').eq('campaign_id', campaignId).order('id'),
        db.from('campaign_shops').select('*').eq('campaign_id', campaignId).order('name'),
        db.from('campaign_trade_events').select('request_id,actor_id,character_id,summary,created_at').eq('campaign_id', campaignId).order('created_at', { ascending: false }).limit(30),
        db.from('campaign_members').select('character_id').eq('campaign_id', campaignId),
      ]);
      for (const result of [v, i, s, e, members]) if (result.error) throw result.error;
      const ids = (members.data ?? []).map(row => row.character_id).filter((id): id is string => Boolean(id));
      const [articles, characters] = await Promise.all([
        s.data?.length ? db.from('campaign_shop_stock').select('*').in('shop_id', s.data.map(row => row.id)) : Promise.resolve({ data: [], error: null }),
        ids.length ? db.from('characters').select('*').in('id', ids) : Promise.resolve({ data: [], error: null }),
      ]);
      if (articles.error || characters.error) throw articles.error ?? characters.error;
      if (request !== sequence.current) return;
      setVault(v.data ?? { campaign_id: campaignId, balance_cp: 0, location: '', version: 0 });
      setItems(i.data ?? []); setShops(s.data ?? []); setStock(articles.data ?? []);
      setPeople(characters.data as Character[] ?? []); setEvents(e.data ?? []);
      setReady(true);
    } catch (error) {
      if (request === sequence.current) { setReady(false); setError(error instanceof Error ? error.message : 'Impossible de charger le coffre et les boutiques. Vérifie les migrations.'); }
    }
  }, [campaignId]);

  useEffect(() => {
    setReady(false); setError(''); setItems([]); setShops([]); setStock([]); setPeople([]); setEvents([]);
    pending.current = null; setUncertain(false);
    void load();
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => { clearTimeout(timer); timer = setTimeout(() => void load(), 100); };
    const db = supabase();
    const channel = db.channel('economy-' + campaignId);
    for (const table of ['campaign_vaults', 'campaign_vault_items', 'campaign_shops', 'campaign_trade_events']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: 'campaign_id=eq.' + campaignId }, refresh);
    }
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_shop_stock' }, refresh).subscribe();
    window.addEventListener('focus', refresh);
    return () => { sequence.current++; clearTimeout(timer); window.removeEventListener('focus', refresh); void db.removeChannel(channel); };
  }, [campaignId, load]);

  async function send(command: Command) {
    if (lock.current || command.campaign !== currentCampaign.current) return false;
    lock.current = true; setBusy(true); setError('');
    try {
      const { error } = await supabase().rpc('campaign_economy_action', {
        p_campaign: command.campaign, p_request: command.request, p_action: command.action, p_data: command.data,
      });
      if (error) {
        if (error.code && error.code !== 'PGRST000' && !error.code.startsWith('08')) { pending.current = null; setUncertain(false); }
        else { pending.current = command; setUncertain(true); }
        throw new Error(error.message);
      }
      pending.current = null; setUncertain(false);
      await load();
      return true;
    } catch (error) {
      if (!pending.current && !(error instanceof Error)) pending.current = command;
      if (pending.current) setUncertain(true);
      setError(pending.current ? 'Le résultat de l’opération est incertain. Réessaie la même commande pour le vérifier.' : (error as Error).message);
      return false;
    } finally { lock.current = false; setBusy(false); }
  }

  async function execute(action: string, data: Record<string, unknown>, confirmation?: string) {
    if (!ready || busy || pending.current) return false;
    if (confirmation && !window.confirm(confirmation)) return false;
    const command = { action, data, request: crypto.randomUUID(), campaign: campaignId };
    pending.current = command;
    return send(command);
  }

  return { vault, items, shops, stock, people, events, ready, busy, error, uncertain, load, execute,
    retry: () => pending.current ? send(pending.current) : Promise.resolve(false) };
}
