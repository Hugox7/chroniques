const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, file);
const classIds2014 = {Barbare:'barbarian', Barde:'bard', Clerc:'cleric', Druide:'druid', Guerrier:'fighter', Moine:'monk', Paladin:'paladin', 'Rôdeur':'ranger', Roublard:'rogue', Ensorceleur:'sorcerer', Occultiste:'warlock', Magicien:'wizard'};
const {
  armorCatalog2014, normalizeInventory2014, itemDefense2014, equippedArmorClass2014,
} = require('../lib/armor-class-2014.ts');
const legacy = normalizeInventory2014(['Cotte de mailles', 'Bouclier en bois']);
const equipped = item => ({ ...item, equipped: true });
const ac = (inventory, DEX = 18) => equippedArmorClass2014({ abilities: { DEX }, inventory }).total;
assert.equal(armorCatalog2014.length, 13);
assert.equal(ac(['Cotte de mailles', 'Bouclier en bois']), 14);
assert.equal(ac(legacy.map(equipped)), 18);
assert.equal(ac([equipped(legacy[1])]), 16);
const [scale, leather] = normalizeInventory2014(['Armure d’écailles', 'Armure de cuir']).map(equipped);
assert.equal(ac([scale]), 16);
assert.equal(ac([scale], 6), 12);
assert.equal(ac([leather]), 15);
assert.equal(ac([scale, leather]), 16);
assert.equal(ac([leather, { ...equipped(legacy[1]), quantity: 0 }]), 15);
assert.equal(ac([equipped(legacy[1]), { ...equipped(legacy[1]), id: 'other' }]), 16);
const [customArmor, customShield] = normalizeInventory2014(['Armure de campagne', 'Bouclier gravé']).map(equipped);
customArmor.defense = { kind: 'armor', base: 15, dexterity: 'capped', dexterityCap: 1 };
customShield.defense = { kind: 'shield', bonus: 3 };
assert.equal(ac(JSON.parse(JSON.stringify([customArmor, customShield]))), 19);
assert.equal(ac([customArmor, customShield], 8), 17);
assert.equal(itemDefense2014({ ...customArmor, defense: { kind: 'armor', base: 15, dexterity: 'capped' } }), undefined);
console.log('CA 2014 : catalogue, inventaires historiques, Dextérité positive et négative, protections personnalisées et règles de cumul.');
