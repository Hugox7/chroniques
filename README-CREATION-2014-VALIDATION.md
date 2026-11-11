# Passe de validation des choix de magie 2014

- Rejet des sorts saisis sur une classe sans magie de niveau 1.
- Fonction d’audit structurée des choix de sorts et de préparation, avec codes d’erreur réutilisables dans l’interface.
- Sécurisation des listes de noms contre les quantités invalides.
- Tests ciblés : `node scripts/test-creation-choices-2014.mjs` (nécessite `tsc` disponible).

Limites : catalogue officiel des sorts non intégré ; fonction d’audit disponible pour une intégration ultérieure dans l’interface ; pas de compilation complète Next.js.
