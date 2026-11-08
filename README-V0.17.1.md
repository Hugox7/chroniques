# Correctif V0.17.1 — source unique des e-mails

- Les e-mails applicatifs envoyés via Resend sont générés exclusivement par `lib/email/templates.ts`.
- Suppression des copies HTML indépendantes `email-templates/resend/` qui pouvaient diverger de l’e-mail réel.
- Préparation d’une fonction `importantNotificationEmail` dans le même module (pas encore reliée à un envoi automatique).
- Les templates d’authentification Supabase restent dans `email-templates/supabase/` et doivent être configurés dans Supabase.
- Aucune migration SQL, aucun changement de configuration Resend.

Si vous copiez les fichiers sur une ancienne version plutôt que de remplacer entièrement le dossier, supprimez manuellement l’ancien dossier `email-templates/resend/`.
