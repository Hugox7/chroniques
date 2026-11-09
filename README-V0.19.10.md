# V0.19.10 — consolidation de sécurité (version candidate, non validée)

Inclut la V0.19.9 et ajoute une migration de sécurisation :
- correction MJ seulement pour la campagne concernée, avec consentement explicite et hors séance active ;
- validation de bornes pour les valeurs numériques sensibles ;
- refus de suppression d’une séance active ;
- conservation des audits des corrections MJ.

**Attention :** ce paquet ne constitue pas une validation de bout en bout. Les restaurations multi-campagnes, les écritures concurrentes, les règles de progression 2014 et les permissions RLS nécessitent encore des tests sur une base isolée. Le build et le typecheck ne sont pas validés ici : dépendances npm absentes. Ne pas appliquer les migrations à une base contenant des personnages importants sans sauvegarde.

Pour vérifier localement : `npm ci`, `npm run typecheck`, `npm run build`. Puis tester les migrations sur un projet Supabase de développement avant `npx supabase db push --remote` sur le projet principal.
