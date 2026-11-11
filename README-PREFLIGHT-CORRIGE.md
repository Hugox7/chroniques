# Consolidation de l'audit bêta

- Ajout de `.env.example` avec les deux variables publiques Supabase attendues. Copier vers `.env.local` et renseigner les valeurs du projet ; ne jamais utiliser de clé service-role dans le navigateur.
- Correction du faux négatif de `scripts/preflight-beta.py` : le test accepte désormais les espaces du code TypeScript et vérifie aussi l'affectation des dimensions au canvas. L'export peint utilise bien 480 × 720 (ratio 2:3) ; l'export non peint utilise 480 × 540.
- `npm run audit:beta` : succès (toutes les étapes).
- Compilation TypeScript isolée des modules de règles de magie et cinq assertions Node : succès.

## Ce qui n'est pas validé

- Aucun `next build` ni parcours navigateur complet : les dépendances npm ne sont pas installées dans cet environnement.
- Le catalogue de sorts reste partiel (44 entrées) et ne couvre pas l'intégralité des règles du Manuel des joueurs 2014.
- Les options raciales et maîtrises conditionnelles ne sont pas encore exhaustives.
