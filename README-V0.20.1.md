# Chroniques & Dés V0.20.1 — Préparation de séance

- Panneau de préparation visible pour le MJ avant chaque séance.
- Compteur de personnages associés et de joueurs inscrits, calculé à partir des membres de la campagne.
- Avertissement contextualisé et confirmation explicite en cas de joueurs sans personnage ou d’absence de joueurs.
- Démarrage conservé via la RPC Supabase `start_game_session` existante : aucune migration.
- La campagne doit toujours être active et le MJ seul peut démarrer la séance.

**Limites :** le panneau est une vérification UX, pas un nouveau verrou de sécurité serveur. Vérifier en bêta la synchronisation des membres, la RPC et les sauvegardes.
