# Chroniques & Dés — priorité SRD 2014

Le référentiel 2014 est désormais la cible fonctionnelle. Les données 2024 préexistantes sont conservées pour une future évolution mais ne sont pas modifiées dans cette livraison.

## Livré

- `data/rulesets/2014/wizard-progression.json` : 20 niveaux du magicien récupérés depuis les contrôles d'API.
- `data/rulesets/2014/class-spells.json` : listes de sorts des 12 classes, dérivées des 319 sorts 2014.
- `data/rulesets/2014/audit.json` : provenance, nombres et limites de couverture.
- `lib/ruleset-2014-progression.ts` : accès typé aux niveaux du magicien et aux listes de sorts. Pour une classe sans progression importée, la fonction retourne `undefined` au lieu de fabriquer des données.
- `scripts/test-ruleset-progression-2014.mjs` : contrôles reproductibles.

## Vérifications

`node scripts/test-ruleset-progression-2014.mjs`

`npm run test:rules`

## À compléter

1. Importer les 20 niveaux des 11 autres classes et les niveaux de toutes les sous-classes.
2. Vérifier les listes de sorts de chaque classe via les endpoints dédiés.
3. Brancher les progressions sur l'interface de montée en niveau, après couverture des règles de choix et des cas multiclasses.
4. Auditer la licence et le périmètre des objets magiques avant publication.

Ce lot est une fondation de données et de tests, pas une montée en niveau automatisée terminée.
