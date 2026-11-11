import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const progression = read('../data/rulesets/2014/wizard-progression.json');
const lists = read('../data/rulesets/2014/class-spells.json');
assert.equal(progression.ruleset, '2014');
assert.deepEqual(progression.levels.map(x => x.level), Array.from({length:20},(_,i)=>i+1));
assert.equal(progression.levels[0].proficiencyBonus, 2);
assert.equal(progression.levels[19].proficiencyBonus, 6);
assert.equal(progression.levels[0].spellcasting.spell_slots_level_1, 2);
assert.equal(Object.keys(lists.classes).length,12);
assert.equal(lists.classes.wizard.length,204);
const seen = new Set();
for(const [klass,spells] of Object.entries(lists.classes)) for(const spell of spells){assert.ok(!seen.has(`${klass}:${spell.id}`));seen.add(`${klass}:${spell.id}`);assert.ok(spell.level>=0&&spell.level<=9)}
console.log('OK: progression magicien 1–20, 12 listes de sorts, 204 sorts magicien.');
