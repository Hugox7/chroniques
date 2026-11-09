# V0.20.5 — Dossier de validation bêta

Cette livraison **ne prétend pas être une bêta validée** : elle fournit une procédure reproductible et un audit hors ligne du contrat entre interface et migrations SQL.

## Avant de lancer
1. Utiliser un projet Supabase **de test** (ne pas appliquer les migrations sur une base de production sans sauvegarde).
2. Appliquer les migrations SQL dans leur ordre chronologique et configurer les variables de `.env.example` dans `.env.local`.
3. Depuis le dossier du projet : `npm ci`, `npm run typecheck`, `npm run build`, `npm run audit:beta`.
4. Démarrer avec `npm run dev` et ouvrir l'URL locale affichée.

## Scénario manuel à valider avec deux navigateurs ou profils séparés
- [ ] A (MJ) crée un compte et se connecte ; B (joueur) crée un compte indépendant.
- [ ] B crée un personnage, choisit ses caractéristiques, équipement, apparence et personnalité ; vérifie la sauvegarde après rechargement.
- [ ] A crée une campagne, invite B ; B accepte l'invitation et associe son personnage.
- [ ] A vérifie le panneau de préparation : B est compté comme joueur avec personnage.
- [ ] A lance une séance ; B constate l'état actif après actualisation.
- [ ] A et B ouvrent les fiches et vérifient les droits de modification pendant la séance.
- [ ] A effectue une interaction autorisée sur le personnage de B ; les deux écrans voient la mise à jour.
- [ ] A ajoute une entrée au journal ; B voit le journal après rechargement.
- [ ] A termine la séance ; les modifications sont conservées et une sauvegarde est consultable.
- [ ] A ouvre l'historique ; vérifie les actions de restauration, annulation et suppression sur des **données de test uniquement**.
- [ ] B quitte puis rejoint sa session ; vérifier que les données restent cohérentes.
- [ ] Vérifier affichage sur mobile, navigation clavier et absence d'erreurs dans la console.

## Scénarios négatifs et sécurité
- [ ] B ne peut pas agir en MJ en manipulant les requêtes réseau.
- [ ] Un utilisateur extérieur ne peut ni lire ni modifier une campagne privée.
- [ ] Un joueur ne peut pas modifier les statistiques verrouillées d'un personnage engagé hors séance.
- [ ] Deux clics rapides sur « commencer/terminer » ne créent pas de doublons.
- [ ] Changer de campagne pendant un chargement ne montre pas les membres de la précédente.
- [ ] Déconnexion puis reconnexion ne laisse aucune donnée privée visible.

## Contrôles automatisés disponibles
- `npm run audit:beta` : contrôles statiques du projet, des séances, du chargement des campagnes, des avatars et du contrat RPC/SQL.
- `npm run typecheck` et `npm run build` : à exécuter avec les dépendances installées.

**Limites :** aucune partie multicomptes n'a été exécutée automatiquement ; la validation RLS, le rendu navigateur, les emails et les appels Supabase exigent un environnement opérationnel.
