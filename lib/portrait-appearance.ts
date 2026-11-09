export const PORTRAIT_PREFIX='CD_AI_V1:';
export const portraitFields={
 gender:['Masculin','Féminin','Androgyne'],
 build:['Mince','Athlétique','Moyenne','Robuste','Massive'],
 hairStyle:['Courts','Mi-longs','Longs','Tressés','Bouclés','Rasés','Chauve'],
 hairColor:['Noirs','Bruns','Châtains','Roux','Blonds','Blancs','Gris','Argentés'],
 eyes:['Bleus','Verts','Marron','Noisette','Gris','Violets','Dorés','Rouges'],
 skin:['Très claire','Claire','Mate','Brune','Foncée','Verte','Grise','Rouge','Écailleuse'],
 clothing:['Tenue de voyage','Armure de cuir','Armure métallique','Robe de mage','Vêtements nobles','Tenue rustique','Tenue de rôdeur'],
 expression:['Sérieuse','Souriante','Mystérieuse','Déterminée','Mélancolique'],
} as const;
export type PortraitField=keyof typeof portraitFields;
export type PortraitAppearance={fields:Record<PortraitField,string>;details:string};
export const portraitLabels:Record<PortraitField,string>={gender:'Présentation',build:'Corpulence',hairStyle:'Coiffure',hairColor:'Couleur des cheveux',eyes:'Couleur des yeux',skin:'Teint / peau',clothing:'Tenue',expression:'Expression'};
export function defaultPortraitAppearance():PortraitAppearance{return {fields:Object.fromEntries(Object.entries(portraitFields).map(([key,values])=>[key,values[0]])) as Record<PortraitField,string>,details:''}}
export function parsePortraitAppearance(raw:string):PortraitAppearance|null{if(!raw.startsWith(PORTRAIT_PREFIX))return null;try{const p=JSON.parse(raw.slice(PORTRAIT_PREFIX.length));if(!p||typeof p.details!=='string'||typeof p.fields!=='object')return null;for(const key of Object.keys(portraitFields) as PortraitField[]){if(!(portraitFields[key] as readonly string[]).includes(p.fields[key]))return null;}return {fields:p.fields,details:p.details.slice(0,1000)}}catch{return null}}
// Conservative filtering: remove free-text clauses mentioning a controlled feature.
// This intentionally drops even compatible repetitions, retaining only additional details.
export function filterPortraitDetails(raw:string){const clauses=raw.split(/(?<=[.!?;\n])\s*|,\s*/);const controlled=/cheveu|chevelure|coiff|frange|tress|chauve|roux|rousse|brun|blond|châtain|noir de jais|yeux|iris|regard (?:bleu|vert|brun|marron|gris|violet)|pupille|corpul|silhouette|muscl|maigr|mince|peau|teint|carnation|épiderme|écaille|vêtu|habill|vêtement|tenue|armure|robe de mage|expression|sourire|souriant|visage (?:triste|joyeux)|masculin|féminin|androgyne/i;return clauses.filter(s=>!controlled.test(s)).join(', ').slice(0,1000)}
