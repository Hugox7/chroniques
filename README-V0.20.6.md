# V0.20.6 — Correctifs de retour bêta : portraits

- Les illustrations fantasy fixes sont affichées avec `object-fit: contain` et un cadre 2:3 correspondant à leur résolution native (600×900), sans étirement ni rognage.
- L’export PNG des illustrations utilise également un ajustement `contain` (au lieu d’un recadrage `cover`).
- Les contrôles de coiffure, teint, tenue, yeux et accessoires sont désactivés pour une illustration fixe afin de ne plus donner l’impression que les modifications sont appliquées.
- Les portraits personnalisables existants et les neuf espèces SVG sont conservés.

**Limite explicite :** les deux illustrations fantasy restent des images complètes non personnalisables. La production de véritables calques illustrés compatibles pour neuf espèces reste un chantier graphique distinct.

**Validation :** vérifier manuellement l’aperçu et l’export pour les deux portraits et pour les modes personnalisables ; build Next.js non exécuté ici.
