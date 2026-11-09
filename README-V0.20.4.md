# V0.20.4 — Audit du chargement des campagnes

## Correctifs
- La page campagne ignore désormais les réponses réseau d'un chargement dépassé par un plus récent, ou correspondant à une autre campagne.
- Changement de campagne : purge des membres, messages, personnages, profils, invitations et informations de l'ancienne campagne pendant le nouveau chargement.
- Les erreurs des quatre requêtes initiales sont toutes vérifiées : auparavant, seule la requête `campaigns` remontait ses erreurs.
- Les chargements secondaires (profils, compagnons récents, invitations) respectent aussi la génération courante.
- À la destruction du composant, les chargements en cours sont invalidés et le canal Realtime est supprimé.

## Validation et limites
- `python scripts/preflight-beta.py`
- `python scripts/check-session-safety.py`
- `python scripts/check-campaign-loading.py`
- Compilation Next.js et tests multicomptes non exécutés : `npm install` échoue dans l'environnement (`Exit handler never called!`).
- Aucun changement SQL.
