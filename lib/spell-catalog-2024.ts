import data from '../data/normalized/spells-2024.json';
/** Catalogue SRD 5.2 indépendant : aucune règle 2024 n'est appliquée au créateur 2014. */
export const spellCatalog2024=data;
export function classCatalogSpells2024(cls:string,level:number){return data.filter(s=>s.level===level&&s.classes.includes(cls));}
