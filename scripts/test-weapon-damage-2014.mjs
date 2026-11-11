import fs from 'node:fs';import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../lib/weapon-damage-2014.ts',import.meta.url),'utf8');
for(const name of ['parseDamageDice2014','weaponDamageExpression2014','damageDiceCount2014','calculateWeaponDamage2014','rollWeaponDamage2014'])assert.match(source,new RegExp(`function ${name}\\(`));
const ui=fs.readFileSync(new URL('../components/campaign-combat-rolls-2014.tsx',import.meta.url),'utf8');
assert.match(ui,/lastAttackHit&&/);assert.match(ui,/Dés physiques/);assert.match(ui,/À deux mains/);assert.match(ui,/Calculer les dégâts/);console.log('Contrôles structurels dégâts armes OK');
