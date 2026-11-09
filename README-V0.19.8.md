# V0.19.8 — Cohérence des personnages (candidat de test, non validé)

- Migration `20261108006000_campaign_consistency.sql` : PV synchronisés en transaction entre fiche et état de campagne, restauration des snapshots étendue aux ressources collaboratives, prévention des engagements multiples, journal rattaché aux séances, suppression sécurisée, corrections MJ autorisées et auditées.
- UI : correction MJ hors séance (PV, or, notes), contrôle de disponibilité des actions collaboratives, avertissement contextualisé lors de la suppression d'une séance.
- Les données existantes ne sont pas automatiquement réconciliées : avant déploiement, sauvegarder la base et vérifier d'éventuels écarts de PV.
- Le test TypeScript n'a pas pu être effectué : dépendances npm absentes de cet environnement. La migration SQL n'a pas été exécutée contre une base de test. **Ne pas pousser la migration sur une base contenant des personnages importants.**
- Limitations : pas encore d'interface MJ complète pour tous les champs ; les permissions de la fiche principale pendant une séance restent limitées à son propriétaire ; les anciennes sauvegardes ne contiennent pas l'état collaboratif. Le rafraîchissement de l'autorisation visuelle peut nécessiter de revenir sur l'onglet.
