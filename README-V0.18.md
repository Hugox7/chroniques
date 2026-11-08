# Chroniques & Dés — V0.18

## Installation

1. Sauvegarder la base Supabase.
2. Dans Supabase SQL Editor, exécuter `supabase/migrations/20261107001000_campaign_lifecycle.sql` **une seule fois**, après les migrations précédentes.
3. Mettre à jour le projet et relancer Next.js.

## Nouveautés

- Cinq statuts manuels de campagne (brouillon, recrutement, en cours, en pause, terminée).
- Confirmation avant lancement si des joueurs n'ont pas de personnage ou si des invitations attendent une réponse.
- Tableau de suivi des invitations pour le MJ, annulation des invitations en attente.
- Acceptation/refus par le joueur sur le tableau de bord.
- Expiration à 30 jours pour les nouvelles invitations, possibilité de renouveler par nouvel envoi.
- Nombre de membres et de personnages associés, statut sur les cartes de campagne.

## Limites

- Les invitations par e-mail continuent à pointer vers `/dashboard` ; la page d'acceptation dédiée sera une prochaine évolution.
- Le statut « en pause » n'interdit pas encore les mutations de ressources : il est pour l'instant informatif.
- Une migration SQL appliquée sur la base est indispensable avant de charger la nouvelle interface.
- La livraison n'inclut aucune variable d'environnement ni les fichiers `.temp` Supabase.
