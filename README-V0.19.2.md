# Chroniques & Dés V0.19.2 — fiche enrichie (aperçu)

Suite de la V0.19.1 : champs de sous-classe, aptitudes, dons, maîtrises d’outils, magie et sorts, vitesse, inspiration, PV temporaires, sauvegardes contre la mort. Les champs de la fiche sont modifiables et persistés dans Supabase.

## Installation

1. `npx supabase db push --remote` (migrations 0.19.1 et 0.19.2 si pas encore appliquées)
2. `npm install` puis `npm run typecheck` et `npm run build`.

## Limites importantes

La progression niveau 1–20, l'attribution automatique des capacités et les emplacements de sorts par classe ne sont **pas encore implémentés**. Les champs avancés sont volontairement libres pour rester compatibles avec les règles maison. Les restaurations de snapshots de la V0.19 restent expérimentales.
