# V0.20.3 — Sécurité des commandes de séance

- Correction d’une fenêtre de concurrence lors de la suppression : verrou conservé pendant la lecture des événements/sauvegardes, la confirmation et l’appel RPC.
- Une erreur lors de la lecture ou de la suppression est affichée et libère le verrou.
- Les réponses obsolètes des chargements temps réel sont ignorées ; nettoyage de l’état lors du changement de campagne.
- Script de vérification statique `python3 scripts/check-session-safety.py`.
- Aucune migration SQL. Les protections serveur de la migration `20261108007000_consolidation_guards.sql` restent indispensables.

## Limites
Pas de compilation Next.js ni de tests multi-utilisateurs Supabase en direct dans cet environnement. Le script vérifie des invariants de code, pas le comportement réel de la base.
