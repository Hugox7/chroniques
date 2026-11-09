# V0.19.21 — Intégration du premier lot PNG

- 11 assets transparents 480×540 dans `public/avatars/layers/`.
- `AvatarPortrait` compose les calques en HTML/CSS, avec rendu immédiat à chaque changement.
- Compatibilité avec la sérialisation existante `CD_AVATAR_V1:` et les deux emplacements du portrait (création et fiche).
- Fallback automatique vers le SVG pour les combinaisons non encore illustrées ou si un asset échoue au chargement.
- Pas de migration SQL.
- Limites : les calques PNG sont stylisés, la palette du premier lot est restreinte, pas encore des illustrations fantasy semi-réalistes définitives.
- Build Next.js non exécuté ici : dépendances absentes.
