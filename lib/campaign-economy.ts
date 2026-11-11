import { shopCatalog } from '@/lib/equipment-extensions';
import type { InventoryItem2014 } from '@/lib/rules';

export type Vault = { campaign_id: string; balance_cp: number; location: string; version: number };
export type VaultItem = { id: string; campaign_id: string; item: Omit<InventoryItem2014, 'id'|'quantity'>; quantity: number };
export type Shop = { id: string; campaign_id: string; name: string; description: string; is_visible: boolean; version: number };
export type Stock = { id: string; shop_id: string; item: { name: string }; price_cp: number; quantity: number };
export type TradeEvent = { request_id: string; actor_id: string; character_id: string|null; summary: string; created_at: string };

export function copperAmount(input: string): number|null {
  const value = input.trim().replace(',', '.');
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value)) return null;
  const [whole, decimal = ''] = value.split('.');
  const amount = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  return amount <= 1_000_000_000 ? amount : null;
}

export function goldLabel(copper: number) {
  return (copper / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' po';
}

const armoryEnd = shopCatalog.findIndex(([name]) => name === 'Bouclier') + 1;
const provisions = new Set(['Sac à dos', 'Sac de couchage', 'Couverture', 'Gourde', 'Torche', 'Rations (1 jour)', 'Corde de chanvre (15 m)', 'Boîte à amadou']);

export const shopTemplates = {
  weapons: { label: 'Armurier', items: shopCatalog.slice(0, armoryEnd), quantity: 5 },
  grocery: { label: 'Épicerie et provisions', items: shopCatalog.filter(([name]) => provisions.has(name)), quantity: 10 },
  general: { label: 'Boutique générale', items: shopCatalog.slice(armoryEnd), quantity: 5 },
  empty: { label: 'Boutique vide', items: [], quantity: 0 },
};
