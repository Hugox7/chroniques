# Verrouillage des dégâts non typés (2014)

Migration : `20261109000200_lock_legacy_damage_2014.sql` (après `20261109000100_typed_damage_2014.sql`).

Les RPC historiques `apply_campaign_character_action` et `apply_campaign_interaction` continuent de servir les soins, conditions et ressources, mais rejettent les actions `damage` non autorisées. La RPC typée marque temporairement sa transaction, puis délègue aux mécanismes existants de journalisation et de PV. Les contrôles d'autorisation existants sont conservés.

**Important :** le marqueur transactionnel PostgreSQL est un verrou adapté à une API PostgREST qui n'expose pas l'exécution de SQL arbitraire. Vérifier qu'aucune autre RPC accessible aux utilisateurs ne peut modifier cette configuration. Pour une défense en profondeur, remplacer à terme le marqueur par une fonction interne dans un schéma privé, avec privilèges explicitement audités.

**Non validé sur base réelle :** appliquer d'abord en développement Supabase, puis vérifier :
1. RPC directe `apply_campaign_character_action(...,'damage',...)` : refus.
2. RPC `apply_campaign_interaction(...,'damage',...)` : refus.
3. RPC `apply_campaign_typed_damage_2014(...)` : dégâts + journal corrects.
4. Soins, conditions et annulation : toujours fonctionnels.
5. Contrôle d'accès joueur/MJ et dégâts simultanés.

Ce lot ne généralise pas encore immunités, vulnérabilités ou résistances hors Rage.
