# Chroniques & Dés — V0.17 (e-mails)

- E-mail d'invitation envoyé par l'API Resend depuis une route Next.js serveur authentifiée.
- Le MJ est vérifié côté serveur ; les compagnons récents passent par la RPC existante.
- Une invitation est créée en base avant l'envoi. En cas d'échec Resend, l'invitation reste visible dans l'application et un message d'erreur apparaît.
- Aucun secret n'est exposé dans `NEXT_PUBLIC_`.
- Templates HTML fournis dans `email-templates/supabase/` pour Supabase Auth. Les modèles applicatifs Resend ont une source unique dans `lib/email/templates.ts`.

## Configuration

1. Vérifier `trameworks.com` dans Resend, ajouter les DNS indiqués dans IONOS (SPF/DKIM), attendre le statut Verified.
2. Créer une clé API Resend autorisée à envoyer.
3. Ajouter dans `.env.local` : `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL` (voir `.env.example`). La clé service role reste strictement serveur.
4. Dans Supabase Auth → SMTP, configurer le serveur SMTP Resend avec les identifiants SMTP fournis par Resend. Utiliser `chroniques@trameworks.com` comme expéditeur une fois le domaine vérifié.
5. Dans Supabase Auth → Email Templates, coller les fichiers HTML correspondants de `email-templates/supabase/`.
6. Relancer `npm run dev` et tester l'invitation avec deux comptes.

**Important :** pour les invitations de campagne, la version actuelle utilise le HTML dans `lib/email/templates.ts`. Les modèles `email-templates/resend/` sont fournis pour consultation/import manuel ; ils ne sont pas automatiquement synchronisés avec l'interface Resend. Aucune migration SQL nouvelle pour cette version.

**À contrôler avant production :** rate limiting des invitations, domaine de production HTTPS et configuration de la redirection Auth Supabase. Ne pas rendre la route publique sans vérification du MJ.
