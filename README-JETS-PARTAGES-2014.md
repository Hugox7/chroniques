# Jets de combat partagés (D&D 2014)

Migration `20261109000500_campaign_combat_rolls_2014.sql` à appliquer après les précédentes.

- Un jet numérique ou physique reste local tant que son auteur ne clique pas « Partager ce jet avec la campagne ».
- Les jets partagés sont visibles dans le journal, actualisé via Supabase Realtime (rechargement possible si Realtime non disponible).
- La table est en lecture pour les participants, insertion pour le MJ ou le propriétaire du personnage associé, sans modification/suppression directe.
- Le journal recalcule le résultat d'après les dés et les modificateurs stockés.
- Les jets ne déclenchent **aucun dégât automatique**. Le MJ garde la liberté d'appliquer manuellement les dégâts via le système typé côté serveur.

## Limites avant production

- Les dés et modificateurs transmis sont déclaratifs : un client modifié peut mentir sur un jet numérique. Pour des jets numériques vérifiables, prévoir une RPC serveur qui tire les dés et calcule les bonus depuis la fiche.
- Les tests réels de migrations, politiques RLS et Realtime sur Supabase restent nécessaires.
- La compilation Next.js/TypeScript complète reste à exécuter avec dépendances installées.
