'use client';

import { BookOpen, ScrollText, Store, Swords, Users } from 'lucide-react';

export const campaignViews = [
  { id: 'session', label: 'Séance', icon: Swords },
  { id: 'company', label: 'Compagnie', icon: Users },
  { id: 'shops', label: 'Lieux et commerces', icon: Store },
  { id: 'journal', label: 'Journal', icon: ScrollText },
  { id: 'documents', label: 'Documents', icon: BookOpen },
] as const;

export type CampaignView = typeof campaignViews[number]['id'];

export default function CampaignNavigation({ view, onChange }: {
  view: CampaignView; onChange: (view: CampaignView) => void;
}) {
  return <nav className="mj-nav campaign-nav" aria-label="Navigation de la campagne">
    {campaignViews.map(({ id, label, icon: Icon }) => <button key={id} type="button"
      aria-pressed={view === id} aria-controls={`campaign-view-${id}`} onClick={() => onChange(id)}>
      <Icon size={18} aria-hidden="true"/><span>{label}</span>
    </button>)}
  </nav>;
}
