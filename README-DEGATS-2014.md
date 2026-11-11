# Dégâts typés — 2014

Le panneau de contrôle d’un personnage de campagne permet de choisir un type de dégâts. Pour un Barbare avec `resource_state.rage_active = true`, les dégâts contondants, perforants et tranchants sont divisés par deux (arrondi inférieur) avant l’appel à `apply_campaign_interaction`. Le journal reçoit le montant brut, le type et l’indication de résistance dans le détail.

**Limites :** le calcul est effectué côté client ; la RPC reçoit le montant final. Le moteur ne traite pas encore les autres résistances/immunités, les vulnérabilités, les sauvegardes ni les dégâts mixtes. La fiche doit être rafraîchie pour refléter une Rage modifiée ailleurs. Une validation serveur sera nécessaire pour un système de combat entièrement autoritaire.
