# Dégâts typés — Journal de campagne (2014)

Le formulaire d'action du journal demande désormais un type de dégâts parmi les 13 types SRD 2014. Pour une action `damage`, il appelle `apply_campaign_typed_damage_2014` avec le montant brut et le type, au lieu d'appeler directement `apply_campaign_interaction`. Les soins et conditions continuent d'utiliser la RPC existante. Le panneau de personnage utilise déjà la RPC typée.

## Vérification

`node scripts/test-typed-damage-routing-2014.mjs` contrôle statiquement les deux appelants et la migration SQL. `npm run test:progression` vérifie les données de progression. Ces tests ne remplacent pas un test Supabase réel ni une compilation Next.js.

## Limites et sécurité

**L'ancien endpoint `apply_campaign_interaction` accepte encore `damage`.** Un client API malveillant peut toujours contourner la réduction : ne pas considérer le système comme sécurisé côté serveur tant que cette voie et les appels directs à `apply_campaign_character_action` n'ont pas été audités et verrouillés dans une migration transactionnelle testée. Le traitement de toutes les résistances, immunités et vulnérabilités est également à faire. Aucun changement de schéma n'est nécessaire pour cette livraison : appliquer d'abord la migration `20261109000100_typed_damage_2014.sql` si elle ne l'est pas déjà.
