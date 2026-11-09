# V0.19.39 — Historique des apparences

- Ajout des boutons Annuler et Rétablir dans le configurateur.
- Historique local borné à 30 états, incluant les modifications de sélecteurs, la génération aléatoire, le changement d’espèce et la réinitialisation.
- Une nouvelle modification efface la pile de rétablissement.
- Un changement externe de personnage ou de valeur réinitialise l’historique afin de ne pas restaurer une apparence appartenant à une autre fiche.
- Aucune migration SQL ; le format CD_AVATAR_V1 reste inchangé.

Contrôles : vérification statique des insertions et intégrité du ZIP. Compilation Next.js non vérifiée sans dépendances installées.
