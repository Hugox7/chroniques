# Chroniques & Dés — validation de sortie bêta

## Contrôles réalisés dans cette archive

- Préflight structure : OK
- Ressources avatars : 55 PNG transparents, dimensions 480×540 : OK
- Portraits fantasy : 600×900, ratio 2:3 : OK (contrôle statique)
- Protections des sessions : OK (contrôle statique)
- Chargement des campagnes : OK (contrôle statique)
- Contrats RPC : 12 vérifiés, aucune erreur (contrôle statique)

**Non vérifié** : compilation TypeScript/Next.js (installation npm indisponible dans l'environnement de validation), connexion réelle Supabase, parcours multi-comptes, affichage navigateur.

## Étape 1 — installation et compilation

Depuis le dossier du projet, avec Node.js installé :

```bash
npm ci
npm run typecheck
npm run build
npm run audit:beta
```

Copier l'erreur complète si une commande échoue. Ne pas poursuivre à l'étape 2 avant correction.

## Étape 2 — parcours manuel unique

Préparer deux comptes distincts (MJ et joueur) et un projet Supabase de test avec les migrations appliquées.

1. Créer un personnage niveau 1 avec le compte joueur ; remplir identité, espèce, classe, équipement, apparence ; enregistrer et recharger la fiche.
2. Modifier le personnage ; vérifier la persistance après actualisation.
3. Vérifier un portrait peint sans étirement et son export ; tester le mode personnalisable et constater quelles options changent effectivement l'image.
4. Créer une campagne avec le compte MJ ; inviter le joueur ; accepter l'invitation depuis le second compte.
5. Démarrer une session ; vérifier la visibilité et les interactions MJ/joueur sur les deux comptes.
6. Terminer la session ; vérifier la confirmation, l'état final et la persistance après actualisation.
7. Tester une action annulée dans la boîte de confirmation : aucune suppression ne doit se produire.
8. Vérifier les cas d'erreur : lien d'invitation invalide, accès à une campagne non autorisée, rechargement pendant une requête.

## Critères de sortie

- Aucune erreur bloquante sur `typecheck`, `build` et `audit:beta`.
- Aucune perte de personnage/campagne/session après actualisation.
- Les permissions MJ/joueur sont respectées.
- Aucune suppression accidentelle.
- Pas de portrait étiré ; toute option visible a un effet réel ou est explicitement désactivée.

Une vérification statique ne vaut pas une validation fonctionnelle.
