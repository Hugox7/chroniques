# V0.19.15 — Verrouillage de la fiche personnelle

- Badge d’engagement avec nom et lien vers la campagne.
- Fiche personnelle en lecture seule dès que le personnage est engagé (même en séance).
- Sauvegarde sans modification optimiste : l’écran ne confirme plus une valeur rejetée.
- Suppression du personnage désactivée pendant l’engagement.
- Nouvelle migration : verrouillage SQL des écritures directes sur les personnages engagés, y compris pendant les séances. Les RPC autorisées restent utilisables.

## À tester

1. `npm install` puis `npm run build`.
2. `npx supabase db push --remote` sur la base de test.
3. Vérifier le badge et l'impossibilité de modifier la fiche personnelle.
4. Vérifier que les changements depuis la campagne en séance fonctionnent encore.

Cette archive est une candidate non validée en conditions multijoueurs.
