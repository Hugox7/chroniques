# Dégâts typés validés côté serveur — 2014

Migration `20261109000100_typed_damage_2014.sql` : nouvelle RPC `apply_campaign_typed_damage_2014`.
Elle contrôle les permissions, le montant et le type, verrouille le personnage, lit la Rage enregistrée et calcule la réduction côté PostgreSQL avant de déléguer au journal d'événements existant. L'interface utilise cette RPC pour les dégâts typés ; le nombre affiché avant validation n'est qu'un aperçu.

**Limites importantes :** cette livraison n'implémente pas encore les immunités/vulnérabilités génériques, ni les jets d'attaque/sauvegarde. L'ancienne RPC `apply_campaign_interaction` reste accessible pour les actions historiques, y compris `damage` : pour garantir que *toutes* les écritures de dégâts soient typées, il faudra migrer les autres appelants et fermer ce chemin de contournement. Le test de migration doit être réalisé sur un projet Supabase de développement avant production.
