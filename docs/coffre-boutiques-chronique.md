# Coffre, boutiques et chronique de campagne

Cette version complète le projet précédent, y compris le bestiaire et ses vignettes.

## Installation

Aucune nouvelle dépendance de l’application. Deux nouvelles migrations :

- `20261110000700_campaign_economy.sql`
- `20261110000800_campaign_chronicle.sql`

Depuis le projet lié au bon compte Supabase :

```sh
npx supabase db push --remote --include-all --dry-run
npx supabase db push --remote --include-all
```

Vérifier la cible et la liste du dry-run avant de pousser. Aucun effacement de données.

## Utilisation

Dans la campagne, ouvrir **Compagnie** pour le coffre et **Lieux et commerces** pour les boutiques. Les bilans se trouvent dans **Journal → Bilans de séance**. Le raccourci économique a été retiré de la barre de séance.

- **Coffre commun** : argent partagé et objets. Chaque joueur associé à un personnage peut déposer et retirer son argent ou ses objets. Les mouvements indiquent leur auteur. Le MJ peut attribuer du butin et préciser où se trouve le coffre. Cet emplacement est informatif ; la charge et le transport ne sont pas calculés.
- **Boutiques** : le MJ crée plusieurs magasins, avec modèles Armurier, Épicerie et provisions, Boutique générale, ou vide. Prix, quantités et articles restent modifiables. Une boutique est initialement masquée. **Ouvrir aux joueurs** la rend accessible. Un stock nul empêche l’achat. Le paiement et la destination peuvent être personnels ou communs. L’achat débite l’argent, réduit le stock et livre l’objet ensemble.
- **Fin de séance** : après la confirmation habituelle, un formulaire facultatif demande résumé, lieux, moments marquants, distance et étape accomplie. **Passer pour l’instant** permet de le remplir plus tard depuis la chronique. Les textes sont visibles par la compagnie : ne pas y écrire de secrets MJ.
- **Chronique** : rassemble les séances terminées et leurs bilans. Les distances renseignées sont additionnées ; les champs vides restent inconnus. L’export texte permet de conserver et partager le récit. La chronique est disponible pendant la campagne et après sa fin.

Les membres peuvent utiliser les ressources communes sans validation supplémentaire du MJ. Il n’y a pas de revente, de dette, ni de transfert à un personnage extérieur à la campagne.

## Cohérence des données

Les commandes économiques sont atomiques et identifiées pour éviter les doublons lors d’une reprise réseau. En cas de résultat incertain, utiliser **Vérifier la dernière opération** avant une nouvelle commande. Les prix et versions des stocks sont revérifiés au moment de l’achat.

Les anciennes restrictions de modification des fiches engagées restent en place. Les objets retirés ou achetés arrivent non équipés. Leurs métadonnées sont conservées lors des transferts. Une restauration de fiche depuis une sauvegarde est refusée si cette fiche a effectué des échanges depuis : restaurer seulement son inventaire créerait des incohérences avec le coffre et les stocks. Les corrections MJ existantes restent accessibles selon les autorisations habituelles.

## Vérifications

TypeScript, compilation Next.js, audits de publication, tests des règles et progression, migrations et scénarios économiques en PostgreSQL embarqué ont été exécutés. Les parcours React de dépôt, achat, reprise réseau, bilan et lecture de chronique ont été vérifiés avec un DOM simulé.

Le scénario base de données est fourni dans `scripts/test-campaign-economy-chronicle.cjs`. Il exige Node.js récent et la dépendance de test facultative `@electric-sql/pglite` ; elle n’est pas nécessaire pour lancer l’application.

```sh
npm install --no-save --package-lock=false @electric-sql/pglite
node scripts/test-campaign-economy-chronicle.cjs
```

Ce scénario utilise une base en mémoire sans identifiants Supabase : transferts, inventaires anciens, argent exact, achats, reprises, stock, droits, boutiques masquées, restauration et résumés.

À vérifier sur l’environnement réel : migrations distantes, notifications Realtime entre deux comptes connectés, achats simultanés depuis plusieurs navigateurs et rendu tactile sur téléphone. Aucun test n’a été effectué sur la base de production.
