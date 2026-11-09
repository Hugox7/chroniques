# V0.19.28 — Complétude et contrôle des calques

- Diadème transparent, même canvas 480×540 et mêmes ancrages que les autres éléments.
- Le diadème est maintenant pris en charge en mode calques PNG humains (plus de repli SVG pour ce choix).
- Script de vérification `python scripts/check-avatar-assets.py` : 54 calques attendus, dimensions, transparence, intégrité des fichiers.
- La composition reste stylisée, **pas encore semi-réaliste**. Aucun portrait fixe présenté comme personnalisable.
- Aucune migration SQL.
- Build Next.js non testé (dépendances npm non installées).
