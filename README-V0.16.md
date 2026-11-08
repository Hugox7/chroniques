# Chroniques & Dés — V0.16

## Journal de campagne

- Un journal global par campagne, filtrable par personnage (acteur ou cible).
- Affichage de l'auteur connecté, de la source et de la cible des modifications.
- Les modifications de PV, PV temporaires et conditions alimentent automatiquement le journal.
- Formulaire « Enregistrer une action » pour préciser quel personnage agit sur quel personnage.
- Annulation atomique de la dernière action d'une cible, par son auteur ou le MJ, avec trace d'annulation conservée.
- Actualisation du journal via Supabase Realtime.

## Installation

Conserver `.env.local`. Vérifier les migrations déjà présentes puis exécuter `npx supabase db push --remote` pour appliquer `20261107000900_campaign_journal.sql`. Installer les dépendances et démarrer Next.js.

## Limites de cette itération

- Les cibles sont des personnages joueurs associés à la campagne ; les monstres/PNJ seront introduits dans le module MJ.
- Les joueurs peuvent modifier leurs propres fiches ; le MJ peut modifier toutes les fiches de sa campagne. Une interaction joueur → autre personnage est donc réservée au MJ à ce stade.
- L'annulation est volontairement stricte : seule la dernière action sur une cible est annulable, pour éviter d'écraser les modifications suivantes.
- Pas de regroupement des événements par session, ni d'actions multi-cibles à ce stade.
- Compilation complète non certifiée dans cet environnement (installation npm expirée).
