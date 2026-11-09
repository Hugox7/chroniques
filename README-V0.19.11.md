# V0.19.11 — Brouillon et suppression définitive

- Messagerie masquée en brouillon et insertion refusée par RLS.
- Démarrage de séance désactivé sauf statut « En cours » ; le RPC Supabase vérifie déjà ce statut.
- Bouton de suppression définitive réservé au propriétaire, confirmation par saisie exacte du nom.
- RPC sécurisé, refus si séance active, suppression en cascade des données liées à la campagne ; les personnages sont conservés.

**Non validé en environnement réel** : `npm ci` n'a pas abouti dans l'environnement de génération ; build et migration non exécutés. Tester sur la base de développement avant toute conclusion de stabilité.
