# Chroniques & Dés — Prototype V0.6

Application de gestion de personnages et de campagnes inspirée des jeux de rôle médiévaux-fantastiques, ciblant les règles D&D 5e (2014).

## Installation

Pré-requis : Node.js 20.9+ (recommandé : Node.js 22).

```bash
npm install
cp .env.example .env.local
npm run dev
```

Sur Windows, utilisez `copy .env.example .env.local` ou créez `.env.local` manuellement. Ouvrez http://localhost:3000.

Sans configuration Supabase, le tableau de bord et la création/gestion de fiches fonctionnent en **mode découverte local** (localStorage). Les campagnes et les comptes exigent Supabase.

## Brancher Supabase

1. Créer un projet Supabase.
2. Dans **Project Settings > API**, copier l'URL du projet et la clé publique (anon/publishable) dans `.env.local`.
3. Dans **SQL Editor**, exécuter `supabase/migrations/001_initial.sql` (une seule fois).
4. Dans **Authentication > URL Configuration**, renseigner `http://localhost:3000` comme Site URL et `http://localhost:3000/auth/callback` comme URL de redirection autorisée. Ajouter ensuite l'URL de production.
5. Redémarrer `npm run dev`, créer un compte, confirmer l'email si demandé.
6. Sur le tableau de bord, cliquer sur **Importer mes personnages du mode découverte** si nécessaire.

Ne mettez **jamais** la `service_role` key dans les variables `NEXT_PUBLIC_*`. La clé publique Supabase est destinée au client, protégée par les politiques RLS. Ne commitez pas `.env.local`.

## État réel de cette version

**Inclus** : interface responsive médiévale, tableau de bord, assistant de création de personnage simplifié, calcul des modificateurs, bonus de maîtrise, PV initiaux, fiche avec édition des PV et notes, jets de dés, export JSON, persistance locale en découverte ou Supabase si connecté, inscription/connexion email, création de campagne, création d'invitation par email (sans envoi d'email), association de personnage et chat avec événements temps réel.

**Non inclus / à faire** : moteur complet des règles SRD 5.1 (bonus d'espèce, compétences, sauvegardes, dons, sorts, équipement, multiclassage, montée de niveau), générateur de portraits et assets superposables, interface d'acceptation des invitations, envoi automatique des invitations, import JSON, synchronisation hors ligne, UX d'édition avancée, tests automatisés et durcissement avant mise en production. Les scores de caractéristique sont volontairement libres pour tester l'UI, ce n'est pas encore une création conforme aux règles 2014.

**Sécurité** : la migration pose des politiques RLS et des contrôles de propriété. Avant publication publique, effectuer une revue de sécurité, des tests multi-utilisateurs et des tests d'autorisations (notamment chat, invitations et accès MJ). Ne pas considérer ce prototype comme prêt pour la production.

**Droits** : aucune reproduction du contenu des manuels propriétaires n'est incluse. Pour la suite, utiliser uniquement le contenu du SRD 5.1 sous CC BY 4.0 avec attribution appropriée, ou des contenus originaux/licenciés.

## Structure

- `app/` : routes et écrans Next.js
- `components/` : structure de navigation
- `lib/rules.ts` : premiers calculs de règles
- `lib/store.ts` : persistance locale/Supabase
- `supabase/migrations/` : schéma et règles d'accès

## Ajouts V0.2 (prototype)
- Jets de sauvegarde calculés avec les maîtrises propres aux 12 classes (règles 2014).
- Liste des 18 compétences avec jets de D20 (sans maîtrise à ce stade).
- Module de mécanique séparé (`lib/character-mechanics.ts`) pour préparer les prochaines étapes.
- **Limite importante :** la sélection des compétences maîtrisées et les bonus d'espèce ne sont pas encore gérés. Les compétences affichées sont donc non maîtrisées.
- L'installation et le build n'ont pas pu être validés dans l'environnement de livraison (installation npm interrompue). Vérifier avec `npm install`, `npm run typecheck`, `npm run build`.

## V0.3 — fiches collaboratives

Après la migration `001_initial.sql`, exécuter `supabase/migrations/002_collaborative_sheets.sql` dans le SQL Editor de Supabase. Cette migration ajoute un état de personnage **propre à chaque campagne**, un journal d'actions et une fonction SQL atomique pour les dégâts, les soins, les PV temporaires et les conditions. Les joueurs peuvent modifier leur personnage associé à la campagne ; le MJ peut modifier les personnages associés de ses joueurs. Les autres membres peuvent consulter les états et l'historique. Le journal enregistre les identifiants des auteurs (l'interface affiche « Un autre participant » en attendant l'ajout des profils publics de campagne).

Limites actuelles : pas encore de bouton Annuler sécurisé, ni d'actions groupées, ni d'interface pour les ressources personnalisées ; le moteur de règles et les tests de bout en bout restent à compléter. Le premier état de campagne est initialisé à partir des PV de la fiche au premier changement ; avant cela, l'interface affiche les PV de la fiche d'origine. Ne pas considérer cette version comme prête pour la production sans audit RLS et tests Supabase.

## V0.4 — maîtrises de compétences (prototype)

Appliquer `supabase/migrations/003_skill_proficiencies.sql` après les migrations 001 et 002. Le créateur comprend désormais une étape de sélection des compétences de classe (nombre et choix selon la classe), en plus des deux compétences accordées par l'historique. Les choix en doublon avec l'historique sont exclus. Les bonus de compétence de la fiche tiennent compte du bonus de maîtrise. Les fiches créées avant cette version restent lisibles, mais leurs anciennes maîtrises ne sont pas automatiquement reconstituées.

Limites : les règles particulières de remplacement de compétences déjà maîtrisées, les variantes d'espèces et d'historiques, l'expertise et les autres sources de maîtrise ne sont pas encore implémentées. Les caractéristiques restent éditables librement et les bonus raciaux ne sont pas encore appliqués. Vérification de compilation non effectuée : installation npm indisponible dans l'environnement de préparation.

## V0.5 — tableau standard et bonus d'espèce

- Attribution des six valeurs du tableau standard 15/14/13/12/10/8, avec validation des doublons.
- Bonus de caractéristiques des **espèces de base** SRD 5.1 (2014), appliqués avant le calcul des PV initiaux et des jets.
- Demi-elfe : choix de deux caractéristiques distinctes (hors Charisme) recevant +1.
- Aperçu des scores finaux avant création. Aucune nouvelle migration SQL nécessaire : les scores finaux sont enregistrés dans le champ `abilities` existant.

**Limite importante :** les sous-espèces et leurs bonus supplémentaires (par exemple nain des collines, haut elfe) ne sont pas encore implémentés. Les résultats ne représentent donc pas encore une création complète conforme au SRD 2014. La création par achat de points et les jets de caractéristiques viendront ensuite.

Cette version ne comprend pas encore les portraits ni les tests d'intégration Supabase. Ne pas publier en production sans vérification du build et des permissions.

## V0.6 — sous-espèces et achat de points

- Sous-espèces SRD 5.1 pour les elfes, nains, halfelins et gnomes, avec bonus de caractéristiques associés.
- Choix entre tableau standard et achat de points à 27 points (coûts 8→0, 9→1, 10→2, 11→3, 12→4, 13→5, 14→7, 15→9).
- Validation des choix avant enregistrement et aperçu des valeurs finales.
- Aucune migration SQL supplémentaire : les scores finaux restent enregistrés dans `abilities`. La sous-espèce est utilisée pour le calcul mais **n'est pas encore persistée comme champ distinct**.

**Limites :** cette version n'implémente pas encore les traits raciaux, la sélection d'équipement, les sorts, les portraits ni le moteur de progression. Le build complet et les tests Supabase restent non validés ; l'installation npm a expiré dans l'environnement de préparation.


## V0.7 — équipement initial

Ajout d’une étape de choix de kit de départ simplifié, sauvegarde de `subrace` et `inventory` dans la fiche et affichage sur la fiche. Appliquer `004_character_details.sql` après les migrations précédentes. Les kits ne remplacent pas encore les choix exhaustifs du SRD 5.1.

## V0.8 — choix détaillés de l'équipement

Les 12 classes disposent désormais de choix indépendants pour leurs armes, armures, focaliseurs et paquetages. L'inventaire est assemblé à partir des choix et des éléments fixes, puis enregistré dans le champ `inventory` existant. Pas de nouvelle migration.

**À vérifier avant de qualifier la conformité de complète :** options d'armes de guerre deux à deux indépendantes, prérequis de maîtrise de certains équipements, contenu exact des paquetages, équipement accordé par les historiques et alternative d'achat avec l'or de départ. Cette version termine le remplacement des kits simplifiés par une interface de choix, mais ne prétend pas encore couvrir intégralement chaque exception des règles 2014.

## V0.9 — Équipement de départ

- Choix de deux armes de guerre distinctes (guerrier et paladin).
- Dépliage du contenu des sept paquetages de départ.
- Ajout des objets et monnaies de départ des onze historiques du prototype.
- Les choix d'objets de certains historiques (outils, jeux, etc.) sont encore des descriptions « au choix ».
- Le système d'équipement n'est pas encore certifié conforme au SRD 5.1 : des restrictions de maîtrise, l'équipement alternatif acheté avec l'or et les variantes d'historiques restent à valider.

Aucune nouvelle migration SQL : l'inventaire utilise la colonne JSON existante.

## V0.10 — équipement de départ

- Choix détaillés des équipements des 12 classes, y compris deux armes distinctes pour guerrier/paladin.
- Contenu des paquetages détaillé dans l'inventaire.
- Choix des outils, jeux, instruments et objets de dévotion des historiques pris en charge.
- Inventaire calculé à partir des choix de classe et d'historique.
- Tests de logique exécutés pour les 12 classes et les 7 historiques comportant des options.

**Limites connues :** l'interface de sélection n'empêche pas encore toutes les combinaisons conditionnées par des maîtrises de domaine (clerc). La compilation Next.js et les tests navigateur/Supabase n'ont pas pu être exécutés, faute de dépendances npm disponibles dans l'environnement. Les équipements de départ doivent encore faire l'objet d'une vérification exhaustive par rapport au SRD 5.1 avant de déclarer le module conforme.

## V0.11 — sécurisation des choix d'équipement

- Les choix obligatoires ne sont plus sélectionnés implicitement : l'étape Équipement ne peut être validée qu'une fois chaque choix effectué.
- Le clerc ne peut plus sélectionner les options réservées à des maîtrises de domaine non encore prises en charge dans le créateur (marteau de guerre, cotte de mailles). Ces choix seront réactivés lorsque les domaines seront implémentés.
- Le druide choisit désormais son focaliseur druidique ; le roublard dispose des trois paquetages de départ ; les deux armes simples du rôdeur sont limitées aux armes de mêlée.
- Les résolveurs rejettent les sélections incomplètes au lieu d'ajouter silencieusement le premier objet.
- Tests de logique passés sur les 12 classes, les 11 historiques, les validations obligatoires et les restrictions du clerc. TypeScript du module `starting-equipment.ts` compilé isolément.

**À savoir avant le test utilisateur :** le moteur de domaines de clerc et l'alternative de création avec l'or de départ ne sont pas implémentés. La compilation globale Next.js, le test navigateur et la persistance Supabase n'ont pas été validés (installation npm non aboutie). Ne pas considérer cette version comme une certification exhaustive de conformité SRD 5.1.


## V0.12 — Domaine et achat avec l’or
Domaine du clerc : Vie (seul domaine du SRD 5.1), autorisant la cotte de mailles. Alternative équipement : lancer les dés d’or de départ et acheter des objets dans un catalogue de base avec contrôle du budget. Appliquer `005_cleric_and_gold.sql` après les migrations précédentes. Le catalogue de prix est un sous-ensemble du SRD, à enrichir; la validation de compilation et les tests Supabase restent nécessaires.
