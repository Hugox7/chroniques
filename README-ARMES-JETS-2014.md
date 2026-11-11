# Armes et jets — D&D 2014

Le panneau de combat reconnaît les armes de l’inventaire libre par correspondance exacte avec le catalogue SRD 2014 (37 armes), avec quelques traductions françaises. Il ne devine pas une arme à partir d’une description ambiguë.

La sélection propose la caractéristique (FOR au corps-à-corps, DEX à distance, meilleure des deux pour une arme finesse) et la maîtrise de base de la classe lorsqu’elle est certaine. Les maîtrises raciales, dons, sous-classes, armes improvisées et propriétés spéciales nécessitent encore une vérification manuelle. La sélection ne déclenche aucun dégât automatique. Les dés physiques et le mode libre restent disponibles.

Le panneau présente le dé de dégâts SRD à titre indicatif. Les propriétés polyvalente, lancer, deux mains, les munitions, les bonus magiques, les arts martiaux, le combat à deux armes et les dégâts critiques ne sont pas encore automatisés.

## Classe d’armure équipée

Dans l’inventaire d’une fiche modifiable, choisir « Équiper » sur une armure ou un bouclier. Les équipements SRD déjà présents sont reconnus par leur nom. Le catalogue propose aussi douze armures et un bouclier. Pour un objet libre, « Paramètres de CA » permet de définir la CA de base, la règle de Dextérité et son plafond, ou le bonus d’un bouclier.

La fiche personnelle et la fiche collaborative affichent la CA d’équipement. Une seule armure et un seul bouclier comptent, et les objets à quantité zéro ne contribuent pas. Sans armure, la base est 10 + le modificateur de Dextérité. Les protections équipées sont enregistrées dans le JSON de l’inventaire existant. L’édition de l’inventaire suit le verrouillage de la fiche en campagne. Les sorts, les capacités et les restrictions de maîtrise restent à arbitrer en jeu.

Test du calcul : `node scripts/test-armor-class-2014.cjs`.
