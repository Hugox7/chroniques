# V0.19.9 — Extension des corrections MJ (aperçu non validé)

- Interface de correction MJ enrichie : PV actuels/max, PV temporaires, or, inspiration, capacités, notes de magie et notes générales.
- Réutilise la RPC `gm_correct_character` et l'audit de la migration V0.19.8.
- Validation locale de nombres avant enregistrement.

## Limitations importantes
- Pas de migration SQL nouvelle pour cette étape ; toutes les migrations antérieures restent nécessaires.
- Compilation TypeScript et build non validés : les paquets npm ne sont pas disponibles en cache (`npm install --offline` échoue avec ENOTCACHED).
- Permissions, restauration et synchronisation nécessitent toujours des tests sur une base de développement isolée. Ne pas exécuter les migrations sur des données importantes sans sauvegarde.
- Les autres champs avancés ne sont pas encore tous éditables par le MJ.
