# Navigation de campagne

Cette version réorganise les fonctions existantes côté MJ et joueur. Elle ne crée ni carte ni gestion de lieux supplémentaire.

## Repères

| Accès | Contenu |
| --- | --- |
| Séance | Séance active, initiative, combat, PV et états, dernières actions, historique des séances |
| Compagnie | Membres, fiches complètes, coffre commun, association du personnage et autorisations, invitations pendant le recrutement |
| Lieux et commerces | Liste des boutiques, préparation MJ, ouverture aux joueurs et achats |
| Journal | Historique des actions et bilans de séance, dans deux vues distinctes |
| Documents | Création, préparation, import et révélation côté MJ ; documents révélés côté joueur |
| Ma fiche | Au-dessus des onglets côté joueur, ouvre la fiche complète dans le panneau latéral existant |
| Discussion | Bouton indépendant au-dessus des onglets, pastille de messages non lus, panneau latéral |
| ⋯ | Modification, statut et suppression de la campagne, confirmations conservées |

Sans personnage associé, le bouton « Choisir mon personnage » conduit dans Compagnie. Le choix n’affiche que les personnages appartenant au joueur.

Le MJ ouvre les fiches depuis Séance ou Compagnie. Les défenses et corrections hors séance sont rangées dans « Outils MJ » sous le personnage concerné. Les droits et le consentement restent inchangés.

## Présentation

- Téléphone : bandeau compact, accès à la fiche et à la discussion, puis cinq onglets avec icônes et libellés. La navigation reste en haut. Le contenu se déroule en une colonne.
- Tablette : navigation au-dessus du contenu ; Séance garde ses colonnes de jeu et d’actions à partir de 768 px.
- Ordinateur : largeur maximale conservée ; Compagnie peut répartir ses personnages et son coffre sur deux colonnes à partir de 1024 px.
- Le coffre présente d’abord son solde et son contenu. Déposer et Retirer déploient seulement le formulaire utile, avec choix Argent ou Objet.
- Les commerces présentent d’abord des magasins nommés. On ouvre un magasin pour voir ses articles. Préparation MJ et achats sont séparés. Les confirmations d’achat sont conservées.
- Le bouton économique a disparu de la barre de séance. Terminer la séance est une action secondaire, séparée des commandes de combat.

Les documents continuent d’être écoutés même lorsque leur onglet est fermé : un document nouvellement révélé peut donc encore ouvrir son aperçu pendant la séance. Le coffre et les boutiques commencent à charger à leur première consultation et conservent ensuite leur état entre les onglets, notamment pour vérifier une opération réseau incertaine.

## Fichiers principaux

- `app/campaigns/[id]/page.tsx` : répartition, bouton de fiche, discussion, rattachement des outils MJ aux membres.
- `components/campaign-navigation.tsx` : navigation commune.
- `components/campaign-character-sheet-drawer.tsx` : accès direct à la fiche, avec les PV et états de campagne.
- `components/game-sessions.tsx` : retrait du raccourci économique, fin de séance secondaire.
- `components/campaign-economy.tsx` : coffre replié et parcours de boutique.
- `components/campaign-documents.tsx` : onglet indépendant et aperçu de révélation hors de l’onglet.
- `components/session-summary.tsx` : nouvelle indication vers Journal → Bilans de séance.
- `app/globals.css` : disposition adaptative, navigation et hiérarchie des actions.

## Installation et validation

Aucune migration supplémentaire et aucune nouvelle dépendance d’exécution. Si la version coffre/boutiques/chronique n’avait pas encore été installée, ses deux migrations restent nécessaires ; voir `coffre-boutiques-chronique.md`.

Vérifications exécutées : compilation Next.js, TypeScript, audits, règles et progression ; parcours React avec DOM simulé pour les deux rôles, accès aux fiches depuis plusieurs onglets, ressources de séance, formulaires du coffre, boutiques, achats et reprise réseau, bilans et révélation de document hors de son onglet.

Un scénario d’interface est fourni dans `scripts/ui/test-campaign-navigation.cjs`. Il utilise des données fictives et ne contacte pas Supabase. Pour le rejouer avec Node.js 24 ou plus récent, installer les dépendances de test facultatives, puis :

```sh
npm install --no-save --package-lock=false jsdom @testing-library/dom
node scripts/ui/test-campaign-navigation.cjs
```

Ces dépendances servent uniquement au test. Elles ne sont pas requises pour lancer l’application.

La vérification visuelle en navigateur et sur un téléphone réel reste à effectuer, ainsi que la synchronisation entre deux comptes sur la vraie base. Les tests DOM ne mesurent pas la disposition ou les débordements en pixels.
