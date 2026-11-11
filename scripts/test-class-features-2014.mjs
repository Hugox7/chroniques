import assert from 'node:assert/strict';
import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync(new URL('../data/rulesets/2014/class-features-by-level.json',import.meta.url)));
assert.equal(d.ruleset,'2014');
assert.equal(Object.keys(d.classes).length,12);
for(const [id,rows] of Object.entries(d.classes)){
 assert.equal(rows.length,20,id);
 assert.deepEqual(rows.map(x=>x.level),Array.from({length:20},(_,i)=>i+1));
 assert.deepEqual(rows.map(x=>x.proficiencyBonus),Array.from({length:20},(_,i)=>2+Math.floor(i/4)));
 for(const row of rows)for(const f of row.features){assert.ok(f.id&&f.name);assert.ok(f.subclass===null||typeof f.subclass==='string')}
}
assert.ok(d.classes.fighter[1].features.some(f=>f.id==='action-surge-1-use'));
console.log('OK: 12 classes, 20 levels each, class feature index.');
