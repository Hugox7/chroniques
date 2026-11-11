import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const editions=[['2014',319],['2024',339]];
let checks=0;
for(const [edition,expected] of editions){
 const spells=load(`../data/normalized/spells-${edition}.json`);
 assert.equal(spells.length,expected);checks++;
 const ids=new Set();
 for(const spell of spells){
  assert.ok(spell.id&&spell.name&&Number.isInteger(spell.level)&&spell.level>=0&&spell.level<=9);checks++;
  assert.ok(!ids.has(spell.id));ids.add(spell.id);checks++;
  assert.ok(Array.isArray(spell.classes)&&spell.classes.length>0);checks++;
  assert.ok(typeof spell.description==='string'&&spell.description.length>0);checks++;
  assert.equal(spell.edition,edition);checks++;
 }
 const issues=load(`../data/normalized/spells-${edition}-issues.json`);
 assert.equal(issues.length,0,`${edition} source discrepancies: ${JSON.stringify(issues.slice(0,3))}`);checks++;
}
console.log(`${checks} contrôles SRD réussis (319 sorts 2014, 339 sorts 2024)`);
