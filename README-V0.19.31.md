# V0.19.31 — Contrôle de la bibliothèque d’avatars

- Ajout de `qa/planche-controle-avatars.jpg` avec six assemblages réels issus des PNG.
- Ajout de `qa/rapport-assets.json` : contrôle des PNG attendus (480 × 540, RGBA, fichiers présents).
- Correction du repli silencieux sur la couleur brune lorsqu’un ancien personnage contient une couleur de cheveux inconnue : l’avatar revient alors au rendu SVG.
- Aucun changement de schéma Supabase.
- Le rendu reste stylisé, et les tests navigateur/compilation Next.js n’ont pas été exécutés.
