/** Rappels de création de niveau 1, règles D&D 5e 2014. Pas un moteur de règles exhaustif. */
export const fighterStyles2014 = ['Archerie','Défense','Duel','Combat à deux armes','Combat avec armes à deux mains','Protection'];
export const sorcererOrigins2014 = ['Lignée draconique','Magie sauvage'];
export const warlockPatrons2014 = ['Archifée','Fiélon','Grand Ancien'];
export const levelOneGuidance2014:Record<string,string[]> = {
 Barbare:['Rage et Défense sans armure : vérifier les usages et les calculs.'],
 Barde:['Choisir deux tours de magie et quatre sorts de niveau 1.','Choisir les maîtrises d’instruments et les langues éventuelles.'],
 Clerc:['Choisir trois tours de magie.','Préparer les sorts selon Sagesse + niveau ; les sorts de domaine sont toujours préparés.'],
 Druide:['Choisir deux tours de magie.','Préparer les sorts selon Sagesse + niveau ; ajouter le druidique.'],
 Guerrier:['Choisir un style de combat ; Second souffle est acquis.'],
 Moine:['Vérifier la Défense sans armure et les armes de moine.'],
 Paladin:['Sens divin et Imposition des mains ; pas de sorts avant le niveau 2.'],
 'Rôdeur':['Choisir un type d’ennemi juré et un terrain de prédilection.','Pas de sorts avant le niveau 2.'],
 Roublard:['Choisir deux maîtrises pour Expertise (compétences ou outils de voleur).','Ajouter l’argot des voleurs.'],
 Ensorceleur:['Choisir quatre tours de magie et deux sorts de niveau 1.','Appliquer les aptitudes de l’origine magique.'],
 Occultiste:['Choisir deux tours de magie et deux sorts de niveau 1.','Appliquer les aptitudes du protecteur choisi.'],
 Magicien:['Choisir trois tours de magie et six sorts de niveau 1 dans le grimoire.','Préparer les sorts selon Intelligence + niveau ; Récupération magique est acquise.']
};
export const alignmentHelp2014:Record<string,string> = {
 'Loyal bon':'Respecte les règles et cherche à faire le bien.',
 'Neutre bon':'Cherche le bien sans préférence forte pour l’ordre ou la liberté.',
 'Chaotique bon':'Privilégie la liberté et la bienveillance.',
 'Loyal neutre':'Privilégie les lois, traditions et engagements.',
 'Neutre':'Recherche un équilibre ou agit sans orientation morale marquée.',
 'Chaotique neutre':'Privilégie sa liberté et son indépendance.',
 'Loyal mauvais':'Utilise règles et hiérarchies à des fins égoïstes ou cruelles.',
 'Neutre mauvais':'Privilégie son intérêt sans égard moral.',
 'Chaotique mauvais':'Suit ses impulsions destructrices et rejette les contraintes.',
 'Sans alignement':'Aucun alignement moral n’est défini.'
};
