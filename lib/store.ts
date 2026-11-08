import {supabase,configured} from './supabase';
import type {Character} from './rules';
const KEY='chroniques-des-characters-v1';
export async function userId(){if(!configured())throw new Error('Supabase non configuré');const {data}=await supabase().auth.getUser();return data.user?.id??null}
export async function listCharacters():Promise<Character[]>{const uid=await userId();if(uid){const {data,error}=await supabase().from('characters').select('*').order('created_at',{ascending:false});if(error)throw error;return (data??[]) as Character[]}throw new Error('Connectez-vous pour consulter vos personnages')}
export async function saveCharacter(c:Character){const uid=await userId();if(uid){const {error}=await supabase().from('characters').upsert({...c,owner_id:uid});if(error)throw error;return}throw new Error('Connectez-vous pour enregistrer votre personnage')}
export async function removeCharacter(id:string){const uid=await userId();if(uid){const {error}=await supabase().from('characters').delete().eq('id',id);if(error)throw error;return}throw new Error('Connectez-vous pour supprimer un personnage')}
export async function getCharacter(id:string){return (await listCharacters()).find(x=>x.id===id)}
export async function importLocalCharacters(){const uid=await userId();if(!uid)return 0;const local=JSON.parse(localStorage.getItem(KEY)||'[]') as Character[];if(!local.length)return 0;const {error}=await supabase().from('characters').upsert(local.map(c=>({...c,owner_id:uid})));if(error)throw error;localStorage.removeItem(KEY);return local.length}
