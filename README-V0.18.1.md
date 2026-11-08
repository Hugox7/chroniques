# Chroniques & Dés — V0.18.1

## Supabase keepalive quotidien

Un workflow GitHub Actions (`.github/workflows/supabase-keepalive.yml`) effectue trois lectures légères de `public.profiles`, espacées de 5 secondes, tous les jours à **03:00 UTC**. Il peut aussi être lancé manuellement dans l’onglet **Actions** de GitHub.

### Mise en place

1. Pousser le projet sur GitHub, sur la **branche par défaut** (GitHub n’exécute les cron planifiés que depuis celle-ci).
2. Ouvrir **Settings → Secrets and variables → Actions → New repository secret**.
3. Ajouter `SUPABASE_URL` (URL du projet Supabase, par ex. `https://xxxxx.supabase.co`).
4. Ajouter `SUPABASE_SERVICE_ROLE_KEY` (clé serveur Supabase `service_role`, à conserver secrète). Ne jamais la mettre dans un fichier versionné ni dans une variable `NEXT_PUBLIC_*`.
5. Dans **Actions → Supabase daily keepalive**, cliquer **Run workflow** pour tester. Vérifier que les trois lectures réussissent.

Le workflow ne modifie aucune donnée. Il utilise les secrets uniquement côté GitHub Actions. La clé `service_role` doit disposer du droit `SELECT` sur `public.profiles` (déjà accordé lors de la configuration de la V0.17.2). Si la requête échoue, l'exécution est marquée en échec et visible dans l'onglet Actions. Les exécutions planifiées GitHub peuvent être retardées ou désactivées après une longue inactivité du dépôt public ; ce mécanisme ne garantit donc pas contractuellement qu'un projet Supabase gratuit ne sera jamais mis en pause.

Aucune migration SQL supplémentaire pour cette version.
