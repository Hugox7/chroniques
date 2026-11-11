import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../lib/combat-proficiencies-2014.ts',import.meta.url),'utf8');
for(const [name,values] of Object.entries({Barbare:['FOR','CON'],Barde:['DEX','CHA'],Clerc:['SAG','CHA'],Druide:['INT','SAG'],Guerrier:['FOR','CON'],Moine:['FOR','DEX'],Paladin:['SAG','CHA'],'Rôdeur':['FOR','DEX'],Roublard:['DEX','INT'],Ensorceleur:['CON','CHA'],Occultiste:['SAG','CHA'],Magicien:['INT','SAG']})) {
 assert.ok(source.includes(`'${name}':['${values[0]}','${values[1]}']`),`Saving throws for ${name}`);
}
assert.ok(source.includes('return canonical?SAVES[canonical].includes(ability):null'));
console.log('12 classes 2014 : maîtrises de sauvegarde déclarées.');
