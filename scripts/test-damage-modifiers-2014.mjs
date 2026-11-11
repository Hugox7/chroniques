import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261109000300_damage_modifiers_2014.sql',import.meta.url),'utf8');
for(const token of ['campaign_damage_modifiers_2014','set_campaign_damage_modifier_2014','v_immunity then 0','v_resistance and v_vulnerability','p_raw*2','floor(p_raw::numeric/2)']) assert.ok(sql.includes(token),token);
const ts=readFileSync(new URL('../lib/damage-modifiers-2014.ts',import.meta.url),'utf8');
assert.ok(ts.includes("modifiers.includes('immunity')"));
console.log('Damage modifiers 2014 structural checks passed');
