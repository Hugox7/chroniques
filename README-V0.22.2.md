# Chroniques & Dés — V0.22.2 : portrait IA dans le parcours

- Étape Apparence : menus structurés + détails libres (1000 caractères).
- Classe et espèce sont récupérées des étapes précédentes.
- Le champ libre est filtré par clauses : les clauses évoquant une caractéristique pilotée par menu sont exclues, même si elles sont compatibles. Le filtrage heuristique n'est pas parfait pour les formulations indirectes.
- Après la validation du récapitulatif, le personnage est enregistré puis l'étape Portrait IA apparaît dans l'assistant. Le bouton de retour est désactivé à cette étape.
- Confirmation des caractéristiques, génération de deux images, choix définitif. En cas de fermeture après l'enregistrement, le portrait peut être terminé depuis la fiche.
- Avant la génération, la colonne d'aperçu affiche un blason générique plutôt que « Portrait IA à venir ».
- Sur la fiche, l'apparence structurée est affichée en lecture seule. Les anciennes descriptions libres restent visibles/modifiables si elles n'ont pas été verrouillées.

## Configuration
Conserver `.env.local` avec `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` et les variables Supabase publiques existantes. Appliquer la migration `20261109000000_ai_portraits.sql` uniquement si elle ne l'a pas déjà été. Aucune nouvelle migration dans cette version.

## Validation
Les six fichiers TS/TSX modifiés ont été vérifiés par transpilation TypeScript (aucune erreur de syntaxe). `npm ci` hors ligne a échoué car le paquet zod n'est pas présent dans le cache, donc ni `npm run typecheck` ni `npm run build` n'ont pu être validés. Aucune génération réelle d'image n'a été effectuée. Exécuter ces commandes en local avant de tester l'API.

## Limites
- Le filtrage de la description libre est heuristique et peut manquer des contradictions implicites. Il privilégie la suppression des clauses suspectes.
- Une génération en cours interrompue par un arrêt brutal du serveur peut nécessiter une intervention de récupération.
- La génération est lancée après l'enregistrement du personnage, à la dernière étape du même assistant, pour éviter de facturer des portraits pour un personnage non enregistré.
