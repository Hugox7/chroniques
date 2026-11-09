/** Aide à la progression monoclassée D&D 5e 2014 (SRD 5.1).
 * Les capacités sont des rappels, pas un moteur d'effets automatiques.
 * Les choix dépendant des sous-classes et les options non-SRD restent manuels.
 */
export const classFeatures2014: Record<string, Record<number, string[]>> = {
  Barbare: {1:['Rage','Défense sans armure'],2:['Attaque téméraire','Sens du danger'],3:['Voie primitive'],5:['Attaque supplémentaire','Déplacement rapide'],7:['Instinct sauvage'],9:['Critique brutal (1 dé)'],11:['Rage implacable'],15:['Rage persistante'],17:['Critique brutal (3 dés)'],18:['Force indomptable'],20:['Champion primordial']},
  Barde: {1:['Inspiration bardique','Incantation'],2:['Touche-à-tout','Chant reposant'],3:['Collège bardique','Expertise'],5:['Inspiration bardique (d8)','Source d’inspiration'],6:['Contre-charme'],10:['Expertise','Secrets magiques'],14:['Secrets magiques'],18:['Secrets magiques'],20:['Inspiration supérieure']},
  Clerc: {1:['Incantation','Domaine divin'],2:['Canalisation d’énergie divine'],5:['Destruction des morts-vivants (FP 1/2)'],8:['Destruction des morts-vivants (FP 1)'],10:['Intervention divine'],11:['Destruction des morts-vivants (FP 2)'],14:['Destruction des morts-vivants (FP 3)'],17:['Destruction des morts-vivants (FP 4)'],20:['Intervention divine améliorée']},
  Druide: {1:['Druidique','Incantation'],2:['Forme sauvage','Cercle druidique'],4:['Forme sauvage (amélioration)'],8:['Forme sauvage (amélioration)'],18:['Corps intemporel','Incantation animale'],20:['Archidruide']},
  Guerrier: {1:['Style de combat','Second souffle'],2:['Sursaut d’activité'],3:['Archétype martial'],5:['Attaque supplémentaire'],9:['Indomptable'],11:['Attaque supplémentaire (2)'],13:['Indomptable (2 utilisations)'],17:['Sursaut d’activité (2 utilisations)','Indomptable (3 utilisations)'],20:['Attaque supplémentaire (3)']},
  Moine: {1:['Arts martiaux','Défense sans armure'],2:['Ki','Déplacement sans armure'],3:['Tradition monastique','Déviation des projectiles'],4:['Chute ralentie'],5:['Attaque supplémentaire','Frappe étourdissante'],6:['Frappes de ki'],7:['Dérobade','Tranquillité de l’esprit'],10:['Pureté du corps'],13:['Langue du soleil et de la lune'],14:['Âme de diamant'],15:['Corps intemporel'],18:['Corps vide'],20:['Perfection de l’être']},
  Paladin: {1:['Sens divin','Imposition des mains'],2:['Style de combat','Incantation','Châtiment divin'],3:['Santé divine','Serment sacré'],5:['Attaque supplémentaire'],6:['Aura de protection'],10:['Aura de courage'],11:['Châtiment divin amélioré'],14:['Contact purificateur'],18:['Aura améliorée']},
  'Rôdeur': {1:['Ennemi juré','Explorateur-né'],2:['Style de combat','Incantation'],3:['Archétype de rôdeur','Conscience primitive'],5:['Attaque supplémentaire'],8:['Traversée des terrains'],10:['Camouflage naturel'],14:['Disparition'],18:['Sens sauvages'],20:['Tueur d’ennemis']},
  Roublard: {1:['Expertise','Attaque sournoise','Argot des voleurs'],2:['Action rusée'],3:['Archétype de roublard'],5:['Esquive instinctive'],7:['Dérobade'],11:['Talent fiable'],14:['Perception aveugle'],15:['Esprit insaisissable'],18:['Insaisissable'],20:['Coup de chance']},
  Ensorceleur: {1:['Incantation','Origine magique'],2:['Source de magie'],3:['Métamagie'],10:['Métamagie (nouvelle option)'],17:['Métamagie (nouvelle option)'],20:['Restauration de sorcellerie']},
  Occultiste: {1:['Protecteur d’outre-monde','Magie de pacte'],2:['Invocations occultes'],3:['Pacte'],11:['Arcanum mystique (niveau 6)'],13:['Arcanum mystique (niveau 7)'],15:['Arcanum mystique (niveau 8)'],17:['Arcanum mystique (niveau 9)'],20:['Maître de l’occulte']},
  Magicien: {1:['Incantation','Récupération magique'],2:['Tradition arcanique'],18:['Maîtrise des sorts'],20:['Sorts de prédilection']}
};
export function newClassFeatures2014(cls:string, level:number):string[]{
  return classFeatures2014[cls]?.[level]??[];
}
export function featureReminderText2014(cls:string, level:number):string {
  return newClassFeatures2014(cls,level).map(feature=>`[Niveau ${level}] ${feature}`).join('\n');
}
