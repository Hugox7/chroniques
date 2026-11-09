# V0.19.35 — Cohérence du mode portrait et options des espèces

- Les huit espèces non humaines ne proposent plus le mode illustration fixe (les deux illustrations fixes représentent des humains).
- La sélection du mode portrait est protégée si une configuration non humaine a été enregistrée avec le mode fixe.
- Le rendu de la barbe pour les nains respecte désormais explicitement le choix « Aucune » après modification par le joueur, tout en conservant la barbe longue proposée lors du choix initial de l’espèce.
- L’export PNG applique la règle de cadrage du mode illustré uniquement aux portraits humains fixes.

Pas de migration de base de données. Les portraits non humains sont encore SVG stylisés ; aucun nouveau calque semi-réaliste n'est inclus. Compilation Next.js non effectuée.
