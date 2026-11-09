# V0.20.2 — Sécurisation des commandes de séance

- Confirmation cohérente des actions Terminer / Annuler, y compris dans la liste historique (auparavant ces deux boutons lançaient directement la RPC).
- Verrou synchrone contre les doubles clics sur les RPC de séance.
- Indicateur de chargement initial pour ne pas afficher temporairement « aucune séance » ou proposer un démarrage avant la lecture serveur.
- Remontée des erreurs RPC inattendues.
- Aucun changement de schéma Supabase.

**À tester en navigateur avec Supabase** : démarrage, fin, annulation, suppression, synchronisation temps réel et droits MJ.
