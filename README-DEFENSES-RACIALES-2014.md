# Défenses raciales et interface MJ — SRD 2014

Appliquer `supabase/migrations/20261109000400_damage_defenses_ui_races_2014.sql` après `20261109000300_damage_modifiers_2014.sql`.

- Le MJ peut consulter et modifier les protections manuelles depuis les fiches collaboratives de campagne. Lecture via RPC SECURITY DEFINER réservée au propriétaire de campagne, écriture via RPC existante.
- Défenses raciales calculées côté serveur : Tieffelin (feu), Nain (poison), Halfelin costaud (poison). Moine niveau 10 : immunité au poison.
- La Rage du Barbare et les protections manuelles restent appliquées.
- Limites : pas encore de drakéide (ascendance de dragon non persistée dans le modèle), ni de protection inférée des objets et sorts ; le résumé UI n'est pas un aperçu exhaustif de toutes les protections manuelles.
- Le moteur utilise la fonction historique `apply_campaign_interaction` avec le montant final. Vérifier sur Supabase réel le comportement des dégâts réduits à zéro (immunité ou résistance à 1 point), la sécurité du marqueur transactionnel et les règles RLS avant mise en production.
- Tests exécutés : `npm run test:progression` et `npm run test:rules` réussis. Pas de `npm run typecheck` (node_modules absents), pas de test PostgreSQL réel.
