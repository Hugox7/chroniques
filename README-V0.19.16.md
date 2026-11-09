# V0.19.16 — Préparation entre les séances

- Champs de personnalité, alignement, notes et sorts connus/préparés modifiables par le propriétaire même si le personnage est engagé.
- Champs de jeu, PV, niveau, inventaire et ressources restent verrouillés depuis la fiche personnelle.
- Nouvelle migration `20261108012000_character_preparation.sql` : autorise uniquement les colonnes de préparation dans le trigger de protection.
- Les sorts sont des champs libres : les contraintes de préparation propres aux classes ne sont pas automatisées.
- **Attention** : le build et l'exécution des migrations doivent être validés avant de considérer cette version stable.
