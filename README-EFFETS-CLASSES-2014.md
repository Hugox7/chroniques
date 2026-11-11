# Effets de classe — première brique 2014

Ajout de `lib/class-effects-2014.ts` : calcul pur du bonus de dégâts de Rage (Force, arme de mêlée, sans armure lourde), résistance aux dégâts contondants/perforants/tranchants pendant la Rage, réduction des dégâts et consommation des points de ki pour Déluge de coups, Défense patiente, Pas du vent et Frappe étourdissante (niveau 5+).

Cette brique est volontairement indépendante de l'interface et de Supabase. **Elle n'est pas encore reliée aux actions de combat ou à la sauvegarde des ressources.** Les conditions de maintien/fin de Rage, l'économie d'actions et les jets de sauvegarde de Frappe étourdissante restent à intégrer.

Test ciblé : `node scripts/test-class-effects-2014.mjs` (nécessite TypeScript installé). Les autres tests et la compilation Next.js n'ont pas été exécutés dans cet environnement.
