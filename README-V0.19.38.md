# V0.19.38 — Morphologies SVG et réinitialisation par espèce

- Les morphologies rondes, anguleuses et creusées modifient désormais réellement la silhouette et les traits du visage dans le rendu SVG (au lieu de ne fonctionner que sur les calques humains).
- Les taches de rousseur et marques d’aventure ne sont plus affichées simultanément : le rendu SVG respecte le choix de texture.
- La réinitialisation conserve l’espèce et restaure une apparence de départ adaptée à cette espèce (notamment barbe du nain, cornes du tieffelin via espèce, absence de cheveux du drakéide).
- Aucun changement de schéma Supabase.

Limites : SVG toujours stylisé, pas de nouveaux calques semi-réalistes. Compilation Next.js et tests navigateur non effectués.
