# Fiabilisation des choix de sorts — D&D 5e 2014

Cette passe corrige la détection des doublons en tenant compte des accents, de la casse et des espaces multiples, y compris pour les sorts du grimoire et les préparations. Elle empêche aussi un grimoire comportant des doublons de passer la validation des sorts préparés.

Tests automatisés : `tsc --target es2022 --module nodenext --moduleResolution nodenext --types node --outDir /tmp/cd-tests tests/creation-choices-2014.test.ts lib/creation-choices-2014.ts && node /tmp/cd-tests/tests/creation-choices-2014.test.js` (nécessite les types Node installés). Les tests ont été exécutés isolément avec une variante JavaScript sans dépendances.

**Limites** : le catalogue des sorts n'est toujours pas intégré ; il faut vérifier les choix de sorts par classe, les capacités raciales et la compilation de l'application complète avant une validation bêta.
