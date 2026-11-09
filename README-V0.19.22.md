# V0.19.22 — portraits illustrés expérimentaux

Ajout de deux portraits humains fantasy plus réalistes (guerrier et aventurière), découpés de la planche de référence artistique, sous forme de fichiers WebP optimisés.

Le configurateur propose désormais deux modes :
- **Personnalisable — calques** : le système V0.19.21 est conservé intact, avec fallback SVG.
- **Illustration fantasy — portrait fixe** : choix entre deux portraits peints. Les autres paramètres d’apparence ne modifient pas ces images ; ce comportement est explicite dans l’interface.

Le choix est stocké dans la configuration `CD_AVATAR_V1:` existante ; aucune migration Supabase.

**Limitation importante** : ce ZIP ne contient PAS de nouveaux calques photoréalistes transparents et alignés. Les deux illustrations sont des portraits fixes issus d'une planche. Les vrais calques semi-réalistes demandent une production d'assets distincts, rigoureusement alignés, qui n'a pas été réalisée. Aucun build Next.js n'a été exécuté.
