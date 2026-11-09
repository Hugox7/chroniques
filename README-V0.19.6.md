# Chroniques & Dés — V0.19.6 (aperçu)

Ajout de compteurs persistants pour les emplacements de sorts et certaines ressources de classe du SRD 5.1 (D&D 5e 2014) : rage, inspiration bardique, canalisation divine, forme sauvage, second souffle, sursaut d'activité, indomptable, ki, imposition des mains et points de sorcellerie. Dépense et récupération manuelles, repos court/long avec confirmation. La magie de pacte de l'occultiste récupère ses emplacements au repos court.

Les compteurs sont enregistrés dans `characters.resource_state` (JSONB). La migration `20261108004000_character_resource_state.sql` ajoute la colonne et étend la restauration des snapshots aux champs avancés et aux compteurs.

**Limites :** pas de moteur complet des sorts, pas de gestion des sorts préparés/connus ou des sous-classes, pas de multiclassage, pas de récupération automatique des PV ou dés de vie. Les ressources particulières de sous-classes, dons et objets magiques ne sont pas prises en charge. La restauration des tables de ressources collaboratives reste à sécuriser. Ne pas restaurer de personnages importants pendant les tests.

Installation : `npm install`, `npx supabase db push --remote`, `npm run typecheck`, `npm run build`. La compilation n'a pas pu être vérifiée ici : les paquets React/Next/Supabase sont absents de l'environnement de validation.
