import type {CustomSubclass2014} from './custom-subclass-2014';
import type {ResourceState} from './resources-2014';

export const abilities=['FOR','DEX','CON','INT','SAG','CHA'] as const;
export type Ability=typeof abilities[number];
export const races=['Humain','Elfe','Nain','Halfelin','Demi-elfe','Demi-orque','Gnome','Drakéide','Tieffelin'] as const;
export const classes=['Barbare','Barde','Clerc','Druide','Guerrier','Moine','Paladin','Rôdeur','Roublard','Ensorceleur','Occultiste','Magicien'] as const;
export const backgrounds=['Acolyte','Artisan de guilde','Charlatan','Criminel','Ermite','Héros du peuple','Marin','Noble','Sage','Soldat','Artiste'] as const;
export type DefenseEquipment2014 =
  | { kind: 'armor'; base: number; dexterity: 'none' | 'full' | 'capped'; dexterityCap?: number }
  | { kind: 'shield'; bonus: number };

export type InventoryItem2014 = {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  defense?: DefenseEquipment2014;
  equipped?: boolean;
};

export type Character={id:string;name:string;race:string;class_name:string;background:string;subrace?:string;cleric_domain?:string;starting_gold?:number;remaining_gold?:number;equipment_method?:string;inventory?:(string|InventoryItem2014)[];alignment?:string;age?:string;height?:string;appearance?:string;personality_traits?:string;ideals?:string;bonds?:string;flaws?:string;languages?:string;subclass?:string;custom_subclass?:CustomSubclass2014|null;features?:string;feats?:string;tool_proficiencies?:string;weapon_proficiencies?:string;armor_proficiencies?:string;spellbook?:string;spellcasting_notes?:string;resource_state?:ResourceState;speed?:number;inspiration?:boolean;temporary_hp?:number;death_save_successes?:number;death_save_failures?:number;level:number;abilities:Record<Ability,number>;hp_current:number;hp_max:number;notes:string;skill_proficiencies?:string[];created_at?:string;owner_id?:string};
export const mod=(score:number)=>Math.floor((score-10)/2);
export const fmt=(value:number)=>value>=0?`+${value}`:`${value}`;
export const proficiency=(level:number)=>2+Math.floor((level-1)/4);
export const hitDice:Record<string,number>={'Barbare':12,'Guerrier':10,'Paladin':10,'Rôdeur':10,'Barde':8,'Clerc':8,'Druide':8,'Moine':8,'Roublard':8,'Occultiste':8,'Magicien':6,'Ensorceleur':6};
export const startingHp=(cls:string,con:number)=>Math.max(1,(hitDice[cls]||8)+mod(con));
export const initialAbilities:Record<Ability,number>={FOR:15,DEX:14,CON:13,INT:12,SAG:10,CHA:8};
export function roll(sides:number){return Math.floor(Math.random()*sides)+1}
export function createCharacter(data:Pick<Character,'name'|'race'|'class_name'|'background'|'abilities'>):Character{const hp=startingHp(data.class_name,data.abilities.CON);return {...data,id:crypto.randomUUID(),level:1,hp_current:hp,hp_max:hp,notes:''}}
export function validateCharacter(c:Character){return c.name.trim().length>0&&c.name.length<=80&&c.level>=1&&c.level<=20&&abilities.every(a=>Number.isInteger(c.abilities[a])&&c.abilities[a]>=1&&c.abilities[a]<=30)}
