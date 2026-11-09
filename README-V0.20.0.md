# Chroniques & Dés — V0.20.0 (pré-bêta technique)

## Livré
- Un script de prévalidation hors ligne (`python scripts/preflight-beta.py`) pour contrôler la structure de l’application, les migrations SQL, les 55+ calques et les portraits fixes.
- Lecture des apparences enregistrées plus défensive : vérification du type des champs et rejet des clés inconnues dans le JSON, tout en conservant le format `CD_AVATAR_V1:`.
- Export PNG des portraits illustrés fixes au format 2:3, cohérent avec l’aperçu. Les portraits en calques/SVG restent en 480×540.

## Limites avant bêta jouable
- Le préflight n’est **pas** un test de compilation ni un test d’intégration Supabase.
- `npm install` n’a pas abouti dans l’environnement de création ; `next build` et les tests navigateur ne sont pas validés.
- La refonte graphique semi-réaliste à calques est encore à réaliser.

## Vérification locale recommandée
`npm ci && npm run typecheck && npm run build && python scripts/preflight-beta.py`
