# Chroniques & Dés — V0.19.3, moteur de progression 2014 (aperçu)

Ajout d'un premier moteur de progression pour personnages **monoclassés** : passage niveau par niveau jusqu'au niveau 20, calcul du gain de PV (valeur fixe ou jet), bonus de maîtrise, DD et bonus d'attaque des sorts, tableau des emplacements de sorts de base (lanceurs complets, demi-lanceurs, occultiste), rappel des niveaux d'amélioration de caractéristiques et demande de sous-classe au niveau prévu.

**Limites :** ceci n'est pas encore le moteur D&D 5e complet. Les capacités spécifiques de classe et de sous-classe, les sorts connus/préparés, les dons, les choix d'amélioration de caractéristiques, les ressources consommées et le multiclassage restent manuels. Les archétypes à magie partielle (guerrier chevalier occulte, roublard escroc arcanique) ne sont pas couverts. La progression ne modifie pas automatiquement les capacités ou caractéristiques. Pour un personnage déjà au niveau supérieur à 1, l'historique de progression n'est pas reconstitué.

La progression met à jour `level`, `hp_max`, `hp_current`, et éventuellement `subclass` dans la table existante. **Aucune nouvelle migration** n'est requise par cette évolution si les migrations V0.19.1 et V0.19.2 sont déjà appliquées.

Tester après `npm install`, `npm run typecheck`, `npm run build`. La compilation n'a pas pu être vérifiée dans l'environnement de préparation faute de dépendances npm installées. Sauvegarder les données avant les essais. Les snapshots V0.19 restent expérimentaux.
