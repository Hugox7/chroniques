const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
const classIds2014 = {Barbare:'barbarian', Barde:'bard', Clerc:'cleric', Druide:'druid', Guerrier:'fighter', Moine:'monk', Paladin:'paladin', 'Rôdeur':'ranger', Roublard:'rogue', Ensorceleur:'sorcerer', Occultiste:'warlock', Magicien:'wizard'};
const source = require('../data/sources/open5e/srd-2014/classes.json');
const { spellSlots2014, asiLevels, planLevelUp } = require('../lib/progression-2014.ts');
const { normalizedResources2014 } = require('../lib/resources-2014.ts');
const { proficiency, classes } = require('../lib/rules.ts');
const cells = line => line.split('|').slice(1,-1).map(cell=>cell.trim());
assert.deepEqual(Object.keys(classIds2014).sort(), [...classes].sort());
for (const [name, id] of Object.entries(classIds2014)) {
  const [header,,...rows] = source.find(entry=>entry.slug===id).table.trim().split('\n').map(cells);
  assert.equal(rows.length,20,id);
  for (const row of rows) {
    const level = parseInt(row[0],10);
    const feature = row[header.indexOf('Features')];
    const slotLevel = parseInt(row[header.indexOf('Slot Level')],10);
    const slots = id==='warlock'
      ? Array.from({length:slotLevel}, (_,i)=>i===slotLevel-1?Number(row[header.indexOf('Spell Slots')]):0)
      : header.flatMap((column,i)=>/^\d+(st|nd|rd|th)$/.test(column)&&/^\d+$/.test(row[i])?[Number(row[i])]:[]);
    const label = name+' niveau '+level;
    assert.deepEqual(spellSlots2014(name,level),slots,label+' emplacements');
    assert.equal(asiLevels[name].includes(level),feature.includes('Ability Score Improvement'),label+' amélioration');
    assert.equal(proficiency(level),Number(row[1]),label+' maîtrise');
  }
}


for (const className of ['Paladin','Rôdeur']) {
  const character = {
    class_name: className, level: 5, subclass: 'Sous-classe maison',
    abilities: {CHA: 14, SAG: 14, CON: 12},
    resource_state: {class_name: className, level: 5, slots: [1]},
  };
  const normalized = normalizedResources2014(character);
  assert.deepEqual(normalized.slots, [2,2]);
  assert.deepEqual(normalizedResources2014({...character,resource_state:normalized}).slots, [2,2]);
  const spent = {...normalized,slots:[0,0]};
  assert.deepEqual(normalizedResources2014({...character,resource_state:spent}).slots, [0,0]);
  assert.deepEqual(normalizedResources2014({...character,level:7,resource_state:spent}).slots, [0,1]);
  assert.deepEqual(planLevelUp({...character,level:4},'average').slots, [4,2]);
  assert.equal(planLevelUp({...character,level:2},'average').requiresSubclass, false);
}
console.log('Progression SRD 5.1 : 12 classes × 20 niveaux, conversion des compteurs et sous-classe personnalisée.');
