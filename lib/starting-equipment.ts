export type Option = {label:string;items:string[]};
export type Choice = {id:string;label:string;options:Option[]};
export type Plan = {fixed:string[];choices:Choice[]};
const opt=(label:string,...items:string[]):Option=>({label,items});
const choice=(id:string,label:string,...options:Option[]):Choice=>({id,label,options});
const simple=['Gourdin','Dague','Massue','Hachette','Javeline','Marteau léger','Masse','Bâton','Serpe','Lance','Arbalète légère','Fléchette','Arc court','Fronde'];
const martial=['Épée longue','Rapière','Hache d’armes','Marteau de guerre','Épée à deux mains','Hache à deux mains','Espadon','Glaive','Hallebarde','Pique','Trident','Fléau','Cimeterre','Épée courte','Fouet','Maillet','Arc long','Arbalète lourde'];
const weapons=(id:string,label:string,kind:'simple'|'martial')=>choice(id,label,...(kind==='simple'?simple:martial).map(x=>opt(x,x)));
const pack=(a:string,b:string)=>choice('pack','Paquetage',opt(a,a),opt(b,b));
const dual=(id:string)=>choice(id,'Armes de guerre',
 ...martial.map(x=>opt(`${x} et bouclier`,x,'Bouclier')),
 ...martial.flatMap((a,i)=>martial.slice(i).map(b=>opt(`Deux armes : ${a} + ${b}`,a,b))));
export const equipmentPlans:Record<string,Plan>={
'Barbare':{fixed:['Paquetage d’explorateur','4 javelines'],choices:[choice('primary','Arme principale',opt('Hache à deux mains','Hache à deux mains'),...martial.map(x=>opt(x,x))),choice('secondary','Arme secondaire',opt('Deux hachettes','2 hachettes'),...simple.map(x=>opt(x,x)))]},
'Barde':{fixed:['Armure de cuir','Dague'],choices:[choice('primary','Arme',opt('Rapière','Rapière'),opt('Épée longue','Épée longue'),...simple.map(x=>opt(x,x))),pack('Paquetage de diplomate','Paquetage d’artiste'),choice('instrument','Instrument',...['Luth','Lyre','Flûte','Viole','Cor','Tambour','Chalemie','Cornemuse','Flûte de Pan','Tympanon'].map(x=>opt(x,x)))]},
'Clerc':{fixed:['Bouclier','Symbole sacré'],choices:[choice('primary','Arme',opt('Masse','Masse'),opt('Marteau de guerre (domaine avec maîtrise martiale)','Marteau de guerre')),choice('armor','Armure',opt('Armure d’écailles','Armure d’écailles'),opt('Armure de cuir','Armure de cuir'),opt('Cotte de mailles (domaine avec armures lourdes)','Cotte de mailles')),choice('ranged','Arme secondaire',opt('Arbalète légère et 20 carreaux','Arbalète légère','20 carreaux'),...simple.map(x=>opt(x,x))),pack('Paquetage de prêtre','Paquetage d’explorateur')]},
'Druide':{fixed:['Armure de cuir','Paquetage d’explorateur'],choices:[choice('focus','Focaliseur druidique',...['Branche de gui','Baguette en if','Bâton druidique','Totem druidique'].map(x=>opt(x,x))),choice('shield','Protection',opt('Bouclier en bois','Bouclier en bois'),...simple.map(x=>opt(x,x))),choice('primary','Arme',opt('Cimeterre','Cimeterre'),...simple.map(x=>opt(x,x)))]},
'Guerrier':{fixed:[],choices:[choice('armor','Armure',opt('Cotte de mailles','Cotte de mailles'),opt('Armure de cuir, arc long et 20 flèches','Armure de cuir','Arc long','20 flèches')),dual('primary'),choice('ranged','Arme secondaire',opt('Arbalète légère et 20 carreaux','Arbalète légère','20 carreaux'),opt('Deux hachettes','2 hachettes')),pack('Paquetage d’exploration souterraine','Paquetage d’explorateur')]},
'Moine':{fixed:['10 fléchettes'],choices:[choice('primary','Arme',opt('Épée courte','Épée courte'),...simple.map(x=>opt(x,x))),pack('Paquetage d’exploration souterraine','Paquetage d’explorateur')]},
'Paladin':{fixed:['Cotte de mailles','Symbole sacré'],choices:[dual('primary'),choice('secondary','Arme secondaire',opt('5 javelines','5 javelines'),...simple.map(x=>opt(x,x))),pack('Paquetage de prêtre','Paquetage d’explorateur')]},
'Rôdeur':{fixed:['Arc long','20 flèches'],choices:[choice('armor','Armure',opt('Armure d’écailles','Armure d’écailles'),opt('Armure de cuir','Armure de cuir')),choice('primary','Deux armes',opt('Deux épées courtes','2 épées courtes'),...simple.filter(x=>!['Arbalète légère','Fléchette','Arc court','Fronde'].includes(x)).map(x=>opt(`Deux ${x}`,`2 ${x}`))),pack('Paquetage d’exploration souterraine','Paquetage d’explorateur')]},
'Roublard':{fixed:['Armure de cuir','2 dagues','Outils de voleur'],choices:[choice('primary','Arme',opt('Rapière','Rapière'),opt('Épée courte','Épée courte')),choice('secondary','Arme secondaire',opt('Arc court et 20 flèches','Arc court','20 flèches'),opt('Épée courte','Épée courte')),choice('pack','Paquetage',opt('Paquetage de cambrioleur','Paquetage de cambrioleur'),opt('Paquetage d’exploration souterraine','Paquetage d’exploration souterraine'),opt('Paquetage d’explorateur','Paquetage d’explorateur'))]},
'Ensorceleur':{fixed:['2 dagues'],choices:[choice('primary','Arme',opt('Arbalète légère et 20 carreaux','Arbalète légère','20 carreaux'),...simple.map(x=>opt(x,x))),choice('focus','Focaliseur',opt('Sacoche à composantes','Sacoche à composantes'),opt('Focaliseur arcanique','Focaliseur arcanique')),pack('Paquetage d’exploration souterraine','Paquetage d’explorateur')]},
'Occultiste':{fixed:['Armure de cuir','2 dagues'],choices:[choice('primary','Arme',opt('Arbalète légère et 20 carreaux','Arbalète légère','20 carreaux'),...simple.map(x=>opt(x,x))),weapons('secondary','Arme secondaire','simple'),choice('focus','Focaliseur',opt('Sacoche à composantes','Sacoche à composantes'),opt('Focaliseur arcanique','Focaliseur arcanique')),pack('Paquetage d’érudit','Paquetage d’exploration souterraine')]},
'Magicien':{fixed:['Grimoire'],choices:[choice('primary','Arme',opt('Bâton','Bâton'),opt('Dague','Dague')),choice('focus','Focaliseur',opt('Sacoche à composantes','Sacoche à composantes'),opt('Focaliseur arcanique','Focaliseur arcanique')),pack('Paquetage d’érudit','Paquetage d’explorateur')]}
};
export function resolveEquipment(cls:string,selection:Record<string,number>):string[]{const p=equipmentPlans[cls];return p?[...p.fixed,...p.choices.flatMap(c=>c.options[selection[c.id]]?.items??[])]:[]}
export function validEquipment(cls:string,selection:Record<string,number>):boolean{const p=equipmentPlans[cls];return !!p&&p.choices.every(c=>Number.isInteger(selection[c.id])&&selection[c.id]>=0&&selection[c.id]<c.options.length)}

/** Contenu détaillé des paquetages, conservé comme inventaire individuel. */
export const packContents:Record<string,string[]> = {
  "Paquetage d’explorateur": [
    "Sac à dos",
    "Sac de couchage",
    "Gamelle",
    "Boîte à amadou",
    "10 torches",
    "10 jours de rations",
    "Gourde",
    "15 m de corde de chanvre"
  ],
  "Paquetage d’exploration souterraine": [
    "Sac à dos",
    "Pied-de-biche",
    "Marteau",
    "10 pitons",
    "10 torches",
    "Boîte à amadou",
    "10 jours de rations",
    "Gourde",
    "15 m de corde de chanvre"
  ],
  "Paquetage de cambrioleur": [
    "Sac à dos",
    "Sac de 1 000 billes",
    "3 m de ficelle",
    "Clochette",
    "5 bougies",
    "Pied-de-biche",
    "Marteau",
    "10 pitons",
    "Lanterne à capote",
    "2 flasques d’huile",
    "5 jours de rations",
    "Boîte à amadou",
    "Gourde",
    "15 m de corde de chanvre"
  ],
  "Paquetage de diplomate": [
    "Coffre",
    "2 étuis à cartes ou parchemins",
    "Vêtements fins",
    "Bouteille d’encre",
    "Plume",
    "Lampe",
    "2 flasques d’huile",
    "5 feuilles de papier",
    "Flacon de parfum",
    "Cire à cacheter",
    "Savon"
  ],
  "Paquetage d’artiste": [
    "Sac à dos",
    "Sac de couchage",
    "2 costumes",
    "5 bougies",
    "5 jours de rations",
    "Gourde",
    "Kit de déguisement"
  ],
  "Paquetage de prêtre": [
    "Sac à dos",
    "Couverture",
    "10 bougies",
    "Boîte à amadou",
    "Boîte à aumônes",
    "2 blocs d’encens",
    "Encensoir",
    "Vêtements sacerdotaux",
    "2 jours de rations",
    "Gourde"
  ],
  "Paquetage d’érudit": [
    "Sac à dos",
    "Livre de connaissances",
    "Bouteille d’encre",
    "Plume",
    "10 feuilles de parchemin",
    "Petit sac de sable",
    "Petit couteau"
  ]
};
export const backgroundEquipment:Record<string,string[]> = {
  "Acolyte": [
    "Symbole sacré",
    "Livre de prières ou moulin à prières",
    "5 bâtons d’encens",
    "Vêtements ordinaires",
    "15 po"
  ],
  "Artisan de guilde": [
    "Outils d’artisan au choix",
    "Lettre de recommandation de la guilde",
    "Vêtements de voyage",
    "15 po"
  ],
  "Charlatan": [
    "Vêtements fins",
    "Kit de déguisement",
    "Outils d’escroquerie au choix",
    "15 po"
  ],
  "Criminel": [
    "Pied-de-biche",
    "Vêtements sombres ordinaires avec capuche",
    "15 po"
  ],
  "Ermite": [
    "Étui à parchemins avec notes",
    "Couverture d’hiver",
    "Vêtements ordinaires",
    "Kit d’herboriste",
    "5 po"
  ],
  "Héros du peuple": [
    "Outils d’artisan au choix",
    "Pelle",
    "Pot en fer",
    "Vêtements ordinaires",
    "10 po"
  ],
  "Marin": [
    "Cabillot",
    "15 m de corde en soie",
    "Porte-bonheur",
    "Vêtements ordinaires",
    "10 po"
  ],
  "Noble": [
    "Vêtements fins",
    "Jeu de société au choix",
    "Parchemin généalogique",
    "25 po"
  ],
  "Sage": [
    "Bouteille d’encre",
    "Plume",
    "Petit couteau",
    "Lettre d’un collègue décédé",
    "Vêtements ordinaires",
    "10 po"
  ],
  "Soldat": [
    "Insigne de grade",
    "Trophée d’un ennemi vaincu",
    "Jeu de dés ou de cartes",
    "Vêtements ordinaires",
    "10 po"
  ],
  "Artiste": [
    "Instrument de musique au choix",
    "Cadeau d’un admirateur",
    "Costume",
    "15 po"
  ]
};
export function expandPacks(items:string[]):string[]{return items.flatMap(item=>packContents[item]?[item,...packContents[item]]:[item]);}
export function resolveCompleteEquipment(cls:string,background:string,selection:Record<string,number>):string[]{
 return [...expandPacks(resolveEquipment(cls,selection)),...(backgroundEquipment[background]??[])];
}

/** Choix matériels des historiques SRD 5.1 : aucune valeur « au choix » ne doit rester dans l'inventaire. */
export type BackgroundChoice = {id:string;label:string;options:string[]};
export const backgroundChoices:Record<string,BackgroundChoice[]> = {
  'Acolyte':[{id:'devotional',label:'Objet de dévotion',options:['Livre de prières','Moulin à prières']}],
  'Artisan de guilde':[{id:'artisan',label:'Outils d’artisan',options:['Outils de forgeron','Outils de charpentier','Outils de menuisier','Outils de maçon','Outils de tanneur','Outils de cordonnier','Outils de bijoutier','Outils de potier','Outils de tisserand','Outils de brasseur','Outils de cuisinier','Outils de souffleur de verre','Outils de peintre','Outils de calligraphe','Outils de cartographe','Outils de réparateur'] }],
  'Charlatan':[{id:'con',label:'Outils d’escroquerie',options:['Dés pipés','Jeu de cartes truqué','Fausse chevalière','Documents falsifiés']}],
  'Héros du peuple':[{id:'artisan',label:'Outils d’artisan',options:['Outils de forgeron','Outils de charpentier','Outils de menuisier','Outils de maçon','Outils de tanneur','Outils de cordonnier','Outils de bijoutier','Outils de potier','Outils de tisserand','Outils de brasseur','Outils de cuisinier','Outils de souffleur de verre','Outils de peintre','Outils de calligraphe','Outils de cartographe','Outils de réparateur']}],
  'Noble':[{id:'game',label:'Jeu',options:['Jeu de cartes','Jeu de dés','Jeu d’échecs','Jeu de dragonchess','Jeu des trois dragons']}],
  'Soldat':[{id:'game',label:'Jeu',options:['Jeu de cartes','Jeu de dés']}],
  'Artiste':[{id:'instrument',label:'Instrument de musique',options:['Luth','Lyre','Flûte','Viole','Cor','Tambour','Chalemie','Cornemuse','Flûte de Pan','Tympanon']}]
};
export function validBackgroundEquipment(background:string,selected:Record<string,number>):boolean{
 if(!Object.prototype.hasOwnProperty.call(backgroundEquipment,background))return false;
 return (backgroundChoices[background]??[]).every(ch=>Number.isInteger(selected[ch.id])&&selected[ch.id]>=0&&selected[ch.id]<ch.options.length);
}
export function resolveBackgroundEquipment(background:string,selected:Record<string,number>):string[]{
 if(!validBackgroundEquipment(background,selected))throw new Error('Choix d’historique incomplets');
 const items=backgroundEquipment[background]??[];
 const picks=Object.fromEntries((backgroundChoices[background]??[]).map(ch=>[ch.id,ch.options[selected[ch.id]]]));
 return items.flatMap(item=>{
  if(item==='Livre de prières ou moulin à prières')return [picks.devotional??'Livre de prières'];
  if(item==='Outils d’artisan au choix')return [picks.artisan??'Outils de forgeron'];
  if(item==='Outils d’escroquerie au choix')return [picks.con??'Dés pipés'];
  if(item==='Jeu de société au choix')return [picks.game??'Jeu de cartes'];
  if(item==='Jeu de dés ou de cartes')return [picks.game??'Jeu de dés'];
  if(item==='Instrument de musique au choix')return [picks.instrument??'Luth'];
  return [item];
 });
}
export function resolveFinalEquipment(cls:string,background:string,selection:Record<string,number>,backgroundSelection:Record<string,number>):string[]{
 if(!validEquipment(cls,selection)||!validBackgroundEquipment(background,backgroundSelection))throw new Error('Choix d’équipement incomplets');
 return [...expandPacks(resolveEquipment(cls,selection)),...resolveBackgroundEquipment(background,backgroundSelection)];
}

/** Vérifie les choix conditionnels du clerc. Tant que le domaine n'est pas
 * sélectionné dans le créateur, les options réservées sont interdites. */
export function validEquipmentForCharacter(cls:string,selection:Record<string,number>,features:{martialWeapons?:boolean;heavyArmor?:boolean}={}):boolean{
 if(!validEquipment(cls,selection))return false;
 if(cls==='Clerc'){
  if(selection.primary===1&&!features.martialWeapons)return false;
  if(selection.armor===2&&!features.heavyArmor)return false;
 }
 return true;
}
