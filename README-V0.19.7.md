# V0.19.7 — Autorisations de campagne (aperçu)

- Case à cocher dans le tableau de bord de campagne pour autoriser le MJ à modifier les **ressources collaboratives** hors séance. Désactivée par défaut, révocable par le joueur.
- Vérification serveur via `can_manage_campaign_character` : hors séance, seules les actions du MJ autorisé sont acceptées ; pendant une séance, MJ et joueur peuvent agir.
- Verrou de base de données sur les modifications directes de la fiche principale lorsqu'un personnage est engagé et qu'aucune séance n'est active.

**Limites connues :** les ressources collaboratives et les PV de la fiche principale ne sont toujours pas synchronisés ; le MJ ne peut pas encore éditer l'ensemble de la fiche hors séance, seulement les ressources collaboratives. Le contrôle des affectations multiples de personnage, les snapshots et la restauration restent à consolider. Le statut de séance n'est pas encore exposé au composant de fiche collaborative pour désactiver visuellement ses boutons : le serveur refuse les actions non autorisées. Ne pas utiliser avec des personnages importants.

Migration : `npx supabase db push --remote`. Vérifier la compilation avec `npm run typecheck` et `npm run build`.
