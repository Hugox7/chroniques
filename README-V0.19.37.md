# V0.19.37 — Correction bloquante JSX

- Correction de la balise `<Choice>` « Type de portrait » dans `components/avatar-builder.tsx` : une guillemet fermante manquante rendait le JSX invalide et empêchait la compilation.
- Aucune migration Supabase ; aucun changement du format de sauvegarde des avatars.
- Validation : vérifier avec `npm install`, puis `npm run typecheck` et `npm run build` dans un environnement disposant des dépendances.

La refonte semi-réaliste des visages n'est pas incluse dans cette version.
