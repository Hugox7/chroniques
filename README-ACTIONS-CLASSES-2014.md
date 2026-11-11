# Actions de classe 2014 — Rage et Ki

- Barbare : activation de Rage (consomme une utilisation), état actif persisté dans `resource_state.rage_active`, arrêt manuel et arrêt lors d'un repos. Affichage du bonus de dégâts selon le niveau. La résistance n'est pas encore appliquée automatiquement aux PV ni aux attaques.
- Moine : boutons de Déluge de coups, Défense patiente, Pas du vent, et Frappe étourdissante (niveau 5+). Chaque bouton consomme un point de Ki et utilise les validations de `lib/class-effects-2014.ts`.
- Les actions sont enregistrées via le callback `onSave` existant du panneau, qui persiste `resource_state`.

## Limites

L'interface ne gère pas encore les durées, conditions de maintien de Rage, économie d'actions, jets de sauvegarde, calcul des dégâts ni l'application automatique des effets aux jets. La gestion de concurrence entre deux clients Supabase n'est pas transactionnelle.
