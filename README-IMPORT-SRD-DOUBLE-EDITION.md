# Import SRD 2014 / 2024 — lot 1

## Réalisé

- Sources originales remises par l'utilisateur conservées sous `data/sources/` (Open5e et dnd5eapi, deux éditions).
- Normalisation de **319 sorts SRD 2014** et **339 sorts SRD 2024** dans `data/normalized/spells-*.json`.
- Chaque sort normalisé possède : ID, édition, nom, niveau, école, classes, temps d'incantation, portée, durée, composantes, matériel, rituel, concentration, description, effet aux niveaux supérieurs, sources.
- Référentiel 2014 branché sur la recherche de sorts du créateur de personnage existant, avec fiches de description consultables.
- Référentiel 2024 disponible séparément dans `lib/spell-catalog-2024.ts`, **pas encore activé dans le créateur de personnage**.
- Index de catégories non-magiques (`classes`, `equipment`, `races`, `backgrounds`, `features`, `feats`, `conditions`, `skills`) produits lorsqu'ils existent dans les données dnd5eapi ; ils ne sont **pas encore branchés** sur les règles de création.
- Test de cohérence et d'unicité des deux catalogues inclus dans `npm run check:release`.

## Limitations explicites

- Les libellés et descriptions des données sources sont en anglais ; les noms français de l'ancien catalogue restent acceptés en tant qu'alias indicatifs, **sans correspondance garantie** avec les identifiants anglais du SRD.
- La comparaison des sources porte ici sur présence et niveau des sorts ; elle **ne valide pas** l'équivalence ligne à ligne de toutes les descriptions.
- Les sorts supplémentaires hors SRD ne sont pas inclus.
- Les sous-classes, espèces, historiques, dons, armes, etc. ne sont pas encore reliés au créateur 2024.
- Le choix de version par le MJ, les règles de compatibilité de campagne et l'éditeur de contenu personnalisé restent à développer.
- Compilation Next.js et essais Supabase / navigateur non exécutés dans ce lot (dépendances absentes du dossier de travail).
- Vérifier les notices et obligations de licence des données avant publication ; le manifeste fourni mentionne CC BY 4.0 et Wizards of the Coast.

## Vérification

`npm run check:release` : audit statique réussi ; 11 contrôles règles 2014, 25 contrôles raciaux, 3294 contrôles des deux catalogues SRD, 6 contrôles magie / bonus raciaux réussis.

## Provenance

`data/sources/manifest.json` : récupéré le 2026-11-09T19:57:45.262Z ; sources Open5e et dnd5eapi. Les fichiers sources ne sont pas altérés.
