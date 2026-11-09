# V0.19.14 — Retours de recette MJ/joueurs

- Remplacement du sélecteur de statut par des actions explicites selon le statut (la validation serveur existante reste en place).
- Badge pour les joueurs sans personnage ; MJ distingué des aventuriers ; compteur hors MJ.
- Abonnement Realtime aux changements de personnages et de séances. Les changements d'association restent écoutés sur campaign_members.
- Suppression du texte obsolète de fin de création. L'alignement existe déjà dans la section Personnalité : aucun ajout de migration requis.
- Journal : les dégâts sont désormais formulés du point de vue de la cible, sans attribuer une attaque à tort au personnage qui perd ses PV.
- Bandeau visible lors d'une séance active.

## Limites

- La sélection de source de dégâts reste dans le formulaire d'événement : le libellé du journal n'en déduit plus automatiquement un attaquant. Une vraie gestion de source libre (monstre, piège) nécessite une évolution SQL et produit.
- Les permissions et la synchronisation doivent être validées avec les trois comptes.
- L'affichage en temps réel dépend de la publication Realtime des tables concernées.
- Les règles D&D 2014 avancées restent hors de cette livraison.
