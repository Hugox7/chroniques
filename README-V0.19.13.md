# V0.19.13 — Correctifs de recette (candidate)

- Invitation : contrôle du propriétaire avec le client authentifié du MJ, comme sur la page campagne ; messages distincts pour erreur Supabase (500), campagne inaccessible (404), non-propriétaire (403), statut non autorisé (409). Le service-role reste utilisé pour les opérations administratives.
- Cycle de vie : transitions unidirectionnelles brouillon → recrutement → en cours → terminée ; pause et reprise depuis en cours, fin possible depuis pause. Contrôle SQL via migration `20261108010000_forward_only_campaign_status.sql` et options UI filtrées.
- Confirmation explicite de clôture définitive.
- Les restrictions brouillon et la suppression réelle des campagnes de V0.19.11/12 sont conservées.

## Déploiement / vérifications

1. `npm install`
2. `npx supabase db push --remote` sur la base de test liée
3. `npm run build`
4. `npm run dev` et retester l'invitation avec le MJ.

**Attention :** le build et les migrations SQL ne sont pas validés dans cet environnement. Si l'invitation retourne désormais 500, consulter le terminal Next.js : la cause Supabase y est journalisée. Vérifier aussi que `SUPABASE_SERVICE_ROLE_KEY` correspond bien au même projet que `NEXT_PUBLIC_SUPABASE_URL`.
