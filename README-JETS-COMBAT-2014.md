# Jets de combat D&D 2014 — première intégration

Le panneau de campagne propose maintenant les jets d'attaque contre une CA et les jets de sauvegarde contre un DD. Modificateurs de caractéristiques, maîtrise (niveau 1–20), bonus manuel et avantage/désavantage sont pris en charge. Sur les attaques, un 20 naturel touche toujours et est critique, un 1 naturel rate toujours. Sur les sauvegardes, les 1/20 naturels n'entraînent pas de succès/échec automatique.

**Limites** : la CA et le DD sont saisis manuellement ; la maîtrise doit être vérifiée pour l'arme ou le jet de sauvegarde ; les jets restent locaux au navigateur, non persistés et non validés par le serveur. Aucun dégât n'est automatiquement appliqué. Ne pas présenter ceci comme un combat multijoueur complet.

## Cibles du MJ

Dans les jets d’attaque, le MJ peut choisir l’un des 322 profils du bestiaire 2014 ou saisir une cible personnalisée. La CA est reprise dans le jet et reste ajustable. Pour le Châtiment divin, le statut fiélon ou mort-vivant est prérempli à partir de la cible et reste modifiable.

Les noms du bestiaire suivent la source Open5e 2014. Les PV affichés sont des valeurs de référence. La sélection est locale au panneau et le journal partagé enregistre le jet et sa CA selon le format existant. La gestion des PV des créatures, de l’initiative et des tours reste manuelle.

## Initiative partagée

Appliquer la migration `supabase/migrations/20261110000100_session_initiative_2014.sql` avant de déployer le panneau.

Pendant une séance active, le MJ ajoute des personnages associés, des créatures ou des PNJ. Il peut saisir les résultats d’initiative ou utiliser le lancer de base avec la Dextérité d’un personnage. Les égalités suivent l’ordre d’ajout. Le bouton « Tour suivant » revient au premier combattant et incrémente le round après le dernier. Les joueurs consultent l’ordre et le tour actif depuis leur vue de campagne. Terminer le combat vide la liste pour la rencontre suivante.

L’ordre est partagé et conservé par séance. Les combattants se préparent avant de lancer le combat. Le suivi des tours est indépendant du calcul des attaques et des PV.
