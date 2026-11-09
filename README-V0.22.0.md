# V0.22.0 — Portraits IA

1. Exécuter `supabase/migrations/20261109000000_ai_portraits.sql` dans Supabase SQL Editor.
2. Vérifier `.env.local` : `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Ne jamais exposer les clés secrètes.
3. `npm ci`, `npm run typecheck`, `npm run build`, puis `npm run dev`.
4. Créer un personnage, renseigner son apparence, ouvrir sa fiche, générer deux portraits, choisir définitivement.
5. Le modèle par défaut est `gpt-image-1` (variable facultative `OPENAI_IMAGE_MODEL`). Il faut disposer des droits API et de crédits.

**Limites** : génération lancée sur la fiche après création du personnage, et non dans l'assistant de création. Le serveur doit permettre des requêtes de 120 s ; un hébergement avec timeout court peut interrompre la génération. En cas d'échec avant sauvegarde, une nouvelle tentative est autorisée, mais un timeout côté réseau peut tout de même être facturé par OpenAI. Les URLs privées sont signées pour une heure et renouvelées au rechargement.
