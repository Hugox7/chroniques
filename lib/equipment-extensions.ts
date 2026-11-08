/** Options SRD 5.1: le seul domaine clérical librement documenté est Vie. */
export const clericDomains = { Vie: { heavyArmor: true, martialWeapons: false } } as const;
export type ClericDomain = keyof typeof clericDomains;
export function clericDomainFeatures(domain: string) {
 const d = clericDomains[domain as ClericDomain];
 return {heavyArmor: d?.heavyArmor ?? false, martialWeapons: d?.martialWeapons ?? false};
}
/** Argent de départ: dés et multiplicateur du Manuel des joueurs 2014. */
export const startingWealth:Record<string,{dice:number;multiplier:number}> = {
 Barbare:{dice:2,multiplier:10},Barde:{dice:5,multiplier:10},Clerc:{dice:5,multiplier:10},
 Druide:{dice:2,multiplier:10},Guerrier:{dice:5,multiplier:10},Moine:{dice:5,multiplier:1},
 Paladin:{dice:5,multiplier:10},Rôdeur:{dice:5,multiplier:10},Roublard:{dice:4,multiplier:10},
 Ensorceleur:{dice:3,multiplier:10},Occultiste:{dice:4,multiplier:10},Magicien:{dice:4,multiplier:10}
};
export function rollStartingGold(cls:string,random:()=>number=Math.random):number {
 const spec=startingWealth[cls];if(!spec)throw Error('Classe inconnue');
 return Array.from({length:spec.dice},()=>Math.floor(random()*4)+1).reduce((a,b)=>a+b,0)*spec.multiplier;
}
/** Prix du SRD en pièces d'or; décimales pour les objets en pa/pc. */
export const shopCatalog = [
 ['Dague',2],['Gourdin',0.1],['Bâton',0.2],['Masse',5],['Hachette',5],['Javeline',0.5],
 ['Épée courte',10],['Épée longue',15],['Rapière',25],['Hache d’armes',10],['Hache à deux mains',30],
 ['Espadon',50],['Marteau de guerre',15],['Cimeterre',25],['Arc court',25],['Arc long',50],
 ['Arbalète légère',25],['Arbalète lourde',50],['20 flèches',1],['20 carreaux',1],
 ['Armure matelassée',5],['Armure de cuir',10],['Armure de cuir clouté',45],['Armure de peaux',10],
 ['Chemise de mailles',50],['Armure d’écailles',50],['Cuirasse',400],['Demi-plate',750],
 ['Broigne',30],['Cotte de mailles',75],['Clibanion',200],['Harnois',1500],['Bouclier',10],
 ['Sac à dos',2],['Sac de couchage',1],['Couverture',0.5],['Gourde',0.2],['Torche',0.01],
 ['Rations (1 jour)',0.5],['Corde de chanvre (15 m)',1],['Boîte à amadou',0.5],
 ['Sacoche à composantes',25],['Focaliseur arcanique (cristal)',10],['Symbole sacré (amulette)',5],
 ['Outils de voleur',25],['Kit d’herboriste',5],['Luth',35],['Flûte',2],['Grimoire',50],
 ['Paquetage d’explorateur',10],['Paquetage d’exploration souterraine',12],['Paquetage de prêtre',19],
 ['Paquetage d’érudit',40],['Paquetage de cambrioleur',16],['Paquetage de diplomate',39],['Paquetage d’artiste',40]
] as const;
export type ShopItem = typeof shopCatalog[number][0];
export function shopTotal(cart:Record<string,number>):number {
 const prices=new Map<string,number>(shopCatalog.map(([n,p])=>[n,p]));
 return Math.round(Object.entries(cart).reduce((sum,[name,qty])=>{
  if(!prices.has(name)||!Number.isSafeInteger(qty)||qty<0||qty>999)throw Error('Panier invalide');
  return sum+prices.get(name)!*qty;
 },0)*100)/100;
}
export function purchasedInventory(cart:Record<string,number>):string[]{
 shopTotal(cart);
 return Object.entries(cart).filter(([,qty])=>qty>0).map(([name,qty])=>qty===1?name:`${qty} × ${name}`);
}
