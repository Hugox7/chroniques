# Audit de magie intégré au créateur

- Affiche les erreurs structurées de choix de sorts dans l’étape 7 du wizard, avec une liste accessible (`role=alert`).
- Bloque le bouton Continuer tant que l’audit signale une erreur.
- La validation finale utilise le même audit afin d’éviter un décalage entre interface et enregistrement.
- Réinitialise les sorts divins préparés lors d’un changement de classe.

Limites : saisie libre des noms (pas de catalogue de sorts), tests Next.js complets non exécutés.
