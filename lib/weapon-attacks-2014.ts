import type {Ability,Character} from './rules';
import weapons from '@/data/normalized/weapons-2014.json';

export type Weapon2014=(typeof weapons)[number];
export type InventoryWeapon2014={inventoryId:string;inventoryName:string;weapon:Weapon2014};
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const aliases:Record<string,string>={
 'epee longue':'longsword','epee courte':'shortsword','epee a deux mains':'greatsword',
 'rapiere':'rapier','dague':'dagger','hache de bataille':'battleaxe',
 'hachette':'handaxe','arc long':'longbow','arc court':'shortbow',
 'arbalete legere':'light-crossbow','arbalete lourde':'heavy-crossbow',
 'arbalete de poing':'hand-crossbow','masse':'mace','baton':'quarterstaff',
 'lance':'spear','javeline':'javelin','gourdin':'club','fronde':'sling',
 'cimeterre':'scimitar','fleau':'flail','marteau de guerre':'warhammer',
 'hallebarde':'halberd','glaive':'glaive','trident':'trident',
};
export function findWeapon2014(name:string):Weapon2014|null {
 const key=normalize(name);const index=aliases[key]??key.replace(/ /g,'-');
 return weapons.find(w=>w.index===index||normalize(w.name)===key)??null;
}
export function inventoryWeapons2014(inventory:Character['inventory']):InventoryWeapon2014[]{
 return (inventory??[]).flatMap((item,i)=>{
  const name=typeof item==='string'?item:item.name;
  const quantity=typeof item==='string'?1:item.quantity;
  const weapon=quantity>0?findWeapon2014(name):null;
  return weapon?[{inventoryId:typeof item==='string'?`legacy-${i}`:item.id,inventoryName:name,weapon}]:[];
 });
}
export function weaponAbility2014(weapon:Weapon2014,abilities:Record<Ability,number>):Ability {
 if(weapon.range==='Ranged')return 'DEX';
 if(weapon.properties.includes('finesse'))return abilities.DEX>abilities.FOR?'DEX':'FOR';
 return 'FOR';
}
const allSimple=new Set(['Barbare','Barde','Clerc','Druide','Guerrier','Moine','Paladin','Rôdeur','Roublard','Ensorceleur','Occultiste']);
const allMartial=new Set(['Barbare','Guerrier','Paladin','Rôdeur']);
const specific:Record<string,string[]>={
 'Barde':['hand-crossbow','longsword','rapier','shortsword'],
 'Druide':['club','dagger','dart','javelin','mace','quarterstaff','scimitar','sickle','sling','spear'],
 'Moine':['shortsword'],
 'Roublard':['hand-crossbow','longsword','rapier','shortsword'],
 'Ensorceleur':['dagger','dart','sling','quarterstaff','light-crossbow'],
 'Occultiste':[],
 'Magicien':['dagger','dart','sling','quarterstaff','light-crossbow'],
};
const classAliases:Record<string,string>={barbarian:'Barbare',bard:'Barde',cleric:'Clerc',druid:'Druide',fighter:'Guerrier',monk:'Moine',paladin:'Paladin',ranger:'Rôdeur',rogue:'Roublard',sorcerer:'Ensorceleur',warlock:'Occultiste',wizard:'Magicien',rodeur:'Rôdeur'};
export function weaponProficiency2014(character:Pick<Character,'class_name'|'weapon_proficiencies'>,weapon:Weapon2014):boolean|null {
 const raw=character.class_name.trim();const cls=classAliases[raw.toLowerCase()]??raw;
 const known=allSimple.has(cls)||cls==='Magicien';
 if(!known)return null;
 const basic=(weapon.category==='Simple'&&allSimple.has(cls))||(weapon.category==='Martial'&&allMartial.has(cls))||(specific[cls]??[]).includes(weapon.index);
 // Additional proficiencies from ancestry, subclass or feats are not inferred from free text.
 return basic?true:null;
}
