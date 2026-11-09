# V0.19.12 — Préparation des campagnes

- Brouillon : le MJ peut modifier le titre et le synopsis, enregistrer ou annuler.
- Invitations par e-mail et invitations de compagnons récents masquées en brouillon.
- Contrôle supplémentaire dans l'API d'envoi et la RPC SQL `create_campaign_invite`.
- Passage du brouillon au recrutement obligatoire avant le lancement d'une campagne.
- Les règles V0.19.11 de messagerie, séances et suppression définitive restent en place.

## Validation

Candidate non déployée. Exécuter les migrations sur Supabase puis tester le parcours de création, édition, recrutement et invitations. Ne pas considérer la version comme stable avant le build et les tests fonctionnels.
