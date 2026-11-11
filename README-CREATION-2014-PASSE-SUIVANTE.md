# Passe suivante — Magicien et préparation de sorts

- Choix structuré des sorts préparés du Magicien de niveau 1 parmi les six sorts de son grimoire.
- Nombre de sorts préparables calculé à partir du score d’Intelligence, avec minimum 1.
- Vérification à la validation : nombre exact, absence de doublons et appartenance au grimoire.
- Conservation des choix dans le champ `spellbook` existant, sans migration.
- Indication du nombre de sorts préparables pour Clerc et Druide, sans prétendre automatiser leurs listes de sorts.

Limites : saisie libre des noms, pas de catalogue de sorts vérifié, pas encore de choix structurés des sorts préparés du Clerc et du Druide.
La compilation complète nécessite les dépendances npm du projet ; aucun test navigateur ni API n’a été exécuté.
