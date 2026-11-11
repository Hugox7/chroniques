# Ressources de classe 2014 — itération

Le panneau de ressources existant est conservé. Ajout du compteur de Récupération arcanique du magicien, réinitialisé au repos long (l'application ne choisit pas automatiquement les emplacements récupérés). Correction de la normalisation des ressources après montée en niveau : les ressources dépensées ne sont plus réinitialisées lors de l'augmentation de niveau ; seules les nouvelles capacités et les augmentations de maximum deviennent disponibles. Les récupérations au repos restent inchangées.

Limites : multiclassage non pris en charge ; effets des dons et sous-classes personnalisées non automatisés ; récupération arcanique des emplacements à gérer manuellement ; PV et dés de vie non restaurés par ces boutons. Les compteurs « illimités » restent représentés par 999.

Contrôles : `npm run test:progression` et `node scripts/test-resources-2014.mjs`.
