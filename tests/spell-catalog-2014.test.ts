import {strict as assert} from 'node:assert';
import {spellCatalog2014,findCatalogSpell2014,catalogSpellWarnings2014} from '../lib/spell-catalog-2014';
assert.ok(spellCatalog2014.length>=30);
assert.ok(findCatalogSpell2014('  LUMIERE ',0)?.classes.includes('Clerc'));
assert.equal(catalogSpellWarnings2014('Clerc',['Lumière'],[]).length,0);
assert.ok(catalogSpellWarnings2014('Clerc',['Décharge occulte'],[]).length>0);
assert.ok(catalogSpellWarnings2014('Magicien',['Projectile magique'],[]).length>0);
assert.equal(catalogSpellWarnings2014('Magicien',['Sort maison'],[]).length,0);
console.log('Catalogue partiel 2014 : OK');
