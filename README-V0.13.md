# Chroniques & Dés — V0.13

## Changements
- Correction des directives `use client` dans les pages personnage et campagne.
- Callback Supabase Auth corrigé et typé.
- Middleware Supabase SSR : connexion obligatoire sur `/dashboard`, `/characters/*` et `/campaigns/*`; chaque compte peut créer personnages et campagnes. Le rôle de MJ est défini par `campaigns.owner_id`, pas globalement.
- Suppression du mode découverte non connecté pour les personnages (les anciennes données locales ne sont pas supprimées).
- Migration `006_member_permissions.sql` : empêche le transfert d'une adhésion à une autre campagne ou à un autre utilisateur.
- Passage déclaré à Zod 4.6.7.

## Installation
1. Copier vos valeurs dans `.env.local` (ne jamais inclure ce fichier dans un ZIP public).
2. `npm install`
3. `npx supabase db push --remote` (seule la migration 006 doit être nouvelle si les 5 premières ont été appliquées).
4. `npx tsc --noEmit && npm run build && npm audit`
5. `npm run dev`

## Points à vérifier
- La connexion, l'inscription et le lien de confirmation email (configurer les URLs de redirection dans Supabase Auth).
- L'accès anonyme à `/characters/new` doit rediriger vers `/login`.
- Un utilisateur peut être MJ d'une campagne et membre d'une autre.
- Les politiques RLS doivent être testées avec deux comptes distincts.

## Important
La compilation et l'audit de sécurité doivent être vérifiés dans votre environnement si les dépendances ne peuvent pas être installées ici. La migration 006 est à appliquer sur votre base Supabase distante.
