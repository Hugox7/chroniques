# Dégâts des classes — D&D 2014

Le calculateur de la fiche collaborative propose les bonus de classe après une attaque réussie avec une arme reconnue de l’inventaire. Il accepte les dés physiques et numériques.

- **Rage (Barbare)** — bonus si la Rage est active, que l’attaque est portée en mêlée avec la Force et que le personnage ne porte pas d’armure lourde. Le port de l’armure lourde est renseigné manuellement.
- **Attaque sournoise (Roublard)** — bonus avec une arme de finesse ou une arme à distance. Le joueur ou le MJ confirme les conditions tactiques et la limite d’une fois par tour. Un critique double les d6.
- **Châtiment divin (Paladin, niveau 2+)** — après une touche en mêlée, choisir un emplacement disponible et indiquer si la cible est un fiélon ou un mort-vivant. Le bonus commence à 2d8 pour un emplacement de niveau 1, augmente de 1d8 par niveau jusqu’à 5d8, puis reçoit 1d8 supplémentaire contre ces créatures. Un critique double tous ces d8. Les dégâts radiants sont affichés séparément des dégâts de l’arme. Cocher « Lancer l’arme » pour une javeline ou une autre arme de mêlée lancée.

L’aperçu est local. En cas d’utilisation du Châtiment, le joueur dépense l’emplacement dans « Ressources et magie » sur sa fiche. Le MJ applique ensuite les dégâts par type. Les tours, la sélection des cibles et le Châtiment divin amélioré du niveau 11 restent à intégrer.

La progression des emplacements du Paladin suit la table du SRD 5.1. Les anciens compteurs conservent leurs dépenses et récupèrent les emplacements manquants lors de la normalisation. Le marqueur de conversion est enregistré avec la prochaine modification des ressources.

Vérification ciblée avec `node scripts/test-class-weapon-damage-2014.mjs`. La compilation Next.js et la validation TypeScript font partie des contrôles de cette version. Les interactions du calculateur ont été testées avec un DOM simulé. Le parcours authentifié avec Supabase reste à vérifier.
