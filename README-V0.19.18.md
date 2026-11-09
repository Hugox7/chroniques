# V0.19.18 — Configurateur d'apparence (prototype vectoriel)

- Nouvelle étape « Apparence » dans l'assistant de création, entre Équipement et Personnalité.
- Retrait du champ texte Apparence de l'étape Personnalité.
- Portrait vectoriel à calques avec choix de teint, coiffure, couleur de cheveux, yeux, barbe, tenue et cicatrice.
- Champ libre « Détails physiques supplémentaires » conservé.
- Configurateur accessible depuis la fiche de personnage, y compris lorsqu'il est engagé dans une campagne.
- Compatibilité avec les anciens champs `appearance` : un ancien texte est repris dans les détails supplémentaires.
- Configuration sauvegardée dans le champ `appearance` existant, sans migration SQL.

## Limites
Le portrait est un **prototype vectoriel original**, pas encore une bibliothèque complète d'illustrations fantasy semi-réalistes. Les déclinaisons par espèce, morphologie et les nombreux accessoires restent à produire. Les choix sont conservés sous un préfixe `CD_AVATAR_V1:` dans le champ `appearance`.

## Vérification
`npm install && npm run build` puis tester création, sauvegarde et réouverture d'un personnage. Compilation non exécutée dans l'environnement de préparation faute de dépendances installées.
