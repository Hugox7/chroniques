# Chroniques & Dés — V0.14

## Nouveautés
- Pseudonyme distinct du nom des personnages à l’inscription, modifiable dans `/settings`.
- Pseudonymes dans la compagnie et la messagerie, avec identification du MJ.
- Invitations en attente visibles sur le tableau de bord et acceptables en un clic.
- Choix du personnage facultatif **après** l’entrée en campagne, affichage « Aucun personnage sélectionné ».
- Le MJ n’est pas obligé de sélectionner un personnage.
- Migration SQL des profils, des GRANT et des correctifs de campagne.

## Installation
1. Conserver le `.env.local` existant lors du remplacement du dossier.
2. `npm install`, puis `npx supabase db push --remote` depuis le projet lié à Supabase.
3. `npm run dev`.

**Migrations :** les fichiers 001 à 006 ont été renommés avec des horodatages correspondant aux migrations déjà appliquées. Si votre projet Supabase possède d’autres horodatages, comparer avec `npx supabase migration list --linked` avant le push. Ne jamais réappliquer les migrations initiales.

**Attention :** les invitations créées par le MJ sont visibles dans le tableau de bord du destinataire, mais **aucun e-mail n’est envoyé automatiquement**. Les utilisateurs existants obtiennent un pseudonyme temporaire `aventurier_...` à modifier dans Profil. Les pseudonymes sont uniques sans distinction de casse.
