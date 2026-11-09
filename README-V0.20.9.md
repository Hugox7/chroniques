# V0.20.9 — Contrôles de sortie bêta

- Vérification statique des parcours, migrations, RPC et ressources avatar.
- Vérification des formats des portraits fantasy (600×900, 2:3) et de leurs calques (480×540, transparents).
- Si un fichier de portrait peint ne se charge pas, affichage d'un portrait SVG de secours plutôt qu'un cadre cassé.
- Aucun changement de schéma ou de données sauvegardées.

## À valider manuellement avant publication

La compilation TypeScript, les scénarios avec Supabase et le rendu navigateur ne sont **pas** validés par les contrôles statiques. Les portraits peints restent fixes ; les huit autres espèces utilisent un rendu SVG. Cette version n'est pas une bêta finale.
