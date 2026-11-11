# Défenses contre les dégâts — 2014

Migration `20261109000300_damage_modifiers_2014.sql` à appliquer après les deux migrations de dégâts typés.

- Table de modificateurs explicites, par campagne/personnage/type/source ; seules les fonctions SECURITY DEFINER peuvent écrire.
- `set_campaign_damage_modifier_2014(...)` : réservé au propriétaire de la campagne (MJ). Il peut activer/désactiver résistance, vulnérabilité et immunité avec une provenance textuelle.
- `apply_campaign_typed_damage_2014(...)` : prend en compte les défenses enregistrées et la Rage, côté serveur. Immunité => 0 ; résistance + vulnérabilité => dégâts normaux ; résistances multiples non cumulatives ; vulnérabilités multiples non cumulatives.
- Le journal garde les dégâts bruts et appliqués dans son détail.

**Limites :** les défenses ne sont pas encore extraites automatiquement des espèces, classes, objets ou sorts ; l'interface MJ de gestion des modificateurs reste à développer. Aucune validation PostgreSQL réelle ni compilation Next.js n'est revendiquée. Le marqueur de transaction des migrations précédentes mérite un audit de sécurité distinct.
