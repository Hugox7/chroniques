# Chroniques & Dés V0.19 — première tranche du Mode Partie

## Installation
Exécuter `supabase/migrations/20261108000100_game_sessions.sql` dans le SQL Editor **après** les migrations précédentes. Remplacer ensuite les fichiers de l'application.

## Inclus
- Création, clôture, annulation et suppression de séances par le MJ.
- Capture automatique des fiches complètes des personnages associés au démarrage de séance.
- Historique de snapshots visible par le propriétaire de chaque personnage.
- Restauration complète par le propriétaire, avec suppression des snapshots plus récents.
- Inventaire libre avec nom et quantité, compatible avec les anciens inventaires texte.

## Limites de cette tranche
- L'historique des événements de campagne n'est pas encore rattaché à une séance : la suppression ne permet donc pas encore de distinguer automatiquement séance vide / séance avec événements. L'avertissement de suppression est systématique.
- La restauration met à jour la fiche `characters`, mais pas l'état collaboratif séparé `campaign_character_state`. La synchronisation de cet état est à traiter avant une utilisation en production.
- Les personnages qui rejoignent une séance après son lancement n'ont pas de snapshot automatique pour cette séance.
- Les permissions des RPC sont à tester sur Supabase avec deux comptes avant déploiement public.
- Compilation Next.js complète non validée dans cet environnement (installation npm indisponible).
