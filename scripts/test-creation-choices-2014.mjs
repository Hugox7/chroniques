import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';import path from 'node:path';
const dir=mkdtempSync(path.join(os.tmpdir(),'cd-rules-'));
try {
 execFileSync('tsc',['--target','es2020','--module','commonjs','--skipLibCheck','--outDir',dir,'lib/creation-choices-2014.ts'],{stdio:'pipe'});
 const r=await import('file://'+path.join(dir,'creation-choices-2014.js'));
 const api=r.default??r;
 assert.equal(api.uniqueNonemptySpellNames2014(['Lumière','Lumiere'],2),false);
 assert.equal(api.uniqueNonemptySpellNames2014(['Lumière','Main de mage'],2),true);
 assert.equal(api.validSpellChoicesLevelOne2014('Guerrier',['Lumière'],[]),false);
 assert.equal(api.validSpellChoicesLevelOne2014('Guerrier',[],[]),true);
 assert.equal(api.preparedSpellCountLevelOne2014('Clerc',8,10),1);
 assert.equal(api.preparedSpellCountLevelOne2014('Magicien',10,16),4);
 assert.equal(api.preparedSpellCountLevelOne2014('Magicien',10,NaN),null);
 const spells=['A','B','C','D','E','F'];
 assert.equal(api.validWizardPreparationLevelOne2014(spells,['A','B','C','D'],16),true);
 assert.equal(api.validWizardPreparationLevelOne2014(spells,['A','B','C','X'],16),false);
 assert.equal(api.auditSpellChoicesLevelOne2014({cls:'Guerrier',cantrips:['A'],spells:[],prepared:[],wisdom:10,intelligence:10})[0].code,'unexpected_spells');
 assert.equal(api.auditSpellChoicesLevelOne2014({cls:'Magicien',cantrips:['A','B','C'],spells,prepared:['A','B','C','D'],wisdom:10,intelligence:16}).length,0);
 console.log('11 contrôles des règles 2014 réussis');
} finally {rmSync(dir,{recursive:true,force:true});}
