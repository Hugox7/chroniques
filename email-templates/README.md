# Templates e-mail — Chroniques & Dés

## E-mails de l’application (Resend)

**Source unique : `lib/email/templates.ts`.** Les fonctions `campaignInvitationEmail` et `importantNotificationEmail` génèrent le HTML et le sujet ; les routes serveur transmettent ce HTML à Resend. Il n’existe volontairement **aucune copie HTML indépendante** dans `email-templates/resend/`, pour éviter toute divergence entre l’aperçu et l’e-mail effectivement envoyé.

Pour modifier l’apparence ou le texte d’une invitation, modifier `lib/email/templates.ts`, puis redéployer. Les modifications dans le tableau de bord Resend n’affectent pas les envois du projet.

`importantNotificationEmail` est préparé pour une utilisation future ; les notifications ne sont pas encore branchées à un déclencheur d’envoi.

## E-mails d’authentification (Supabase)

Dans Supabase → Authentication → Email Templates, coller les fichiers HTML de `email-templates/supabase/` dans les types correspondants. Les variables `{{ .ConfirmationURL }}` sont interprétées par Supabase et ne doivent pas être remplacées par des URL fixes.

Configurer l’envoi SMTP personnalisé de Supabase avec Resend. **Ces modèles restent nécessairement dans Supabase**, et ne sont pas utilisés par la route Next.js d’invitation de campagne.
