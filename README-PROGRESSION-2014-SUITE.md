# Progression 2014 — sélection des capacités

- Le panneau de montée en niveau utilise maintenant l'index des capacités SRD pour les douze classes.
- Les capacités communes sont proposées au bon niveau. Les capacités de sous-classe ne sont ajoutées que si la sous-classe SRD correspond au choix du personnage.
- Un choix de sous-classe SRD est proposé au niveau requis. Les sous-classes personnalisées restent possibles, mais leurs capacités ne sont pas inventées.
- Les rappels déjà enregistrés ne sont pas dupliqués.

## Limites

Les capacités sont des rappels textuels, pas des effets automatiques. La sélection des options internes (p. ex. choix d'une capacité de Chasseur) n'est pas encore modélisée. La progression complète de ressources propres aux classes nécessite les sous-endpoints `/levels`. Aucun catalogue 2024 n'est activé.

Tests exécutés : `npm run test:progression` (OK). Compilation Next.js non exécutée.

## Contrôle des tables de classe

`npm run test:progression` compare les bonus de maîtrise, les niveaux d’amélioration de caractéristiques et les emplacements de sorts pour les 12 classes aux niveaux 1 à 20. La référence du test est la table de chaque classe dans `data/sources/open5e/srd-2014/classes.json`.

Les emplacements du Rôdeur se débloquent maintenant au niveau indiqué dans sa table. Au niveau 5, le maximum est de quatre emplacements de niveau 1 et deux de niveau 2. Les compteurs antérieurs sont convertis en conservant le nombre d’emplacements déjà dépensés. La prochaine sauvegarde des ressources enregistre le marqueur de conversion dans le JSON existant.

La progression du personnage reste calculée à partir de sa classe et de son niveau. Le choix d’une sous-classe personnalisée est conservé.
