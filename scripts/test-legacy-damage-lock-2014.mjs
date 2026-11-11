import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261109000200_lock_legacy_damage_2014.sql',import.meta.url),'utf8');
for(const name of ['apply_campaign_character_action','apply_campaign_interaction','apply_campaign_typed_damage_2014']) assert.match(sql,new RegExp('create or replace function public\\.'+name+'\\('));
assert.equal((sql.match(/is distinct from 'authorized'/g)||[]).length,2);
assert.match(sql,/set_config\('app\.typed_damage_2014','authorized',true\)/);
assert.match(sql,/set_config\('app\.typed_damage_2014','',true\)/);
assert.match(sql,/p_damage_type in \('bludgeoning','piercing','slashing'\)/);
console.log('Legacy damage RPC guards: OK');
