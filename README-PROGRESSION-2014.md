# Progression 2014 — consolidation

## Ajout

- `data/rulesets/2014/class-features-by-level.json` : index des capacités de 12 classes, niveaux 1–20, construit à partir des 407 entrées `dnd5eapi/2014/features.json` du ZIP source.
- `lib/ruleset-2014-progression.ts` : fonctions `getClassFeaturesAtLevel2014` et `getClassFeatureTimeline2014`.
- `scripts/build-class-progression-2014.mjs` : régénération reproductible depuis le ZIP de données.
- `scripts/test-class-features-2014.mjs` : tests structurels et exemple du Guerrier.

## Limites

Cet index ne remplace pas les sous-ressources officielles `/classes/{index}/levels` et `/subclasses/{index}/levels`. Les tables de ressources spécifiques (rage, ki, inspiration, etc.) et les choix de progression ne sont pas certifiés exhaustifs. L'index peut inclure des capacités de sous-classes; leur activation doit dépendre de la sous-classe effectivement choisie. Aucune migration de base de données ni branchement automatique à la montée en niveau n'est effectué ici.

## Vérification

```bash
node scripts/test-class-features-2014.mjs
node scripts/test-ruleset-progression-2014.mjs
```
