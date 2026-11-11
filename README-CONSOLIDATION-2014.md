# Consolidation de la création 2014

- Les choix de bonus du demi-elfe ne sont plus acceptés pour une autre espèce.
- Une sous-espèce héritée d'une sélection précédente est rejetée si l'espèce n'a pas de sous-espèce.
- Nouveau test `node scripts/test-races-2014.mjs` : parcourt les neuf espèces, leurs sous-espèces disponibles et les bonus calculés.
- Les audits statiques bêta et le test des choix de sorts restent opérationnels.

## Limites importantes

Ce lot ne prouve pas que le créateur est exhaustif pour le Manuel des Joueurs 2014. Le catalogue de sorts reste partiel et les tests de navigation, d'authentification, de Supabase et de création complète dans un navigateur réel restent à effectuer avec les dépendances et services configurés.
