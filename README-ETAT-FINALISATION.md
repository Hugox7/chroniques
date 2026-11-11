# Chroniques & Dés — état de finalisation (9 novembre 2026)

## Contrôles exécutables sans services externes

`npm run check:release` lance l'audit statique de l'application et les tests de règles (choix de création, bonus raciaux, catalogue de sorts). Il ne remplace **pas** un test fonctionnel en navigateur.

## Vérifications encore obligatoires avant de déclarer la bêta finalisée

1. Installer les dépendances : `npm ci` (ou `npm install` si aucun verrou de dépendances n'est fourni).
2. Configurer Supabase avec `.env.example` et appliquer les migrations dans l'ordre.
3. Exécuter `npm run typecheck` et `npm run build` ; corriger toute erreur.
4. Dans un navigateur, vérifier inscription/connexion, création et sauvegarde de personnages pour plusieurs classes, notamment Magicien, Clerc, Druide, Guerrier et Demi-elfe.
5. Vérifier invitations, campagnes, autorisations MJ/joueur, actualisation temps réel, portrait et récupération de session.
6. Compléter et vérifier le référentiel de règles : 44 sorts seulement sont recensés ; les sorts et certaines options raciales ou maîtrises du Manuel des Joueurs 2014 ne sont pas exhaustifs. La saisie maison reste possible.

**Statut : version candidate à la validation, pas bêta certifiée.** Aucun test navigateur/Supabase réel n'a été effectué dans ce lot.
