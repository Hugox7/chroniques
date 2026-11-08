# Chroniques & Dés — V0.15

## Compagnons récents

Dans une campagne dont vous êtes MJ, la section « Compagnons récents » affiche jusqu'à 30 joueurs avec lesquels vous avez déjà partagé au moins une campagne, avec leur pseudonyme et le nombre de campagnes en commun. Vous pouvez les inviter en un clic sans connaître ou révéler leur adresse e-mail. Les invitations par e-mail restent disponibles.

Un compagnon déjà membre de la campagne n'est pas proposé. Les invitations apparaissent sur le tableau de bord du destinataire ; l'envoi automatique d'e-mail n'est toujours pas intégré.

## Installation

Conservez `.env.local`. Décompressez `chroniques-et-des.zip` dans votre dossier de travail, puis :

```bash
npm install
npx supabase migration list --linked
npx supabase db push --remote
npm run dev
```

La migration ajoutée est `20261107000800_recent_players.sql`. Vérifiez que les migrations précédentes (00100 à 00700) sont déjà appliquées avant le `db push`. La fonction SQL ne rend pas les e-mails publics et ne propose que les utilisateurs avec une campagne commune.
