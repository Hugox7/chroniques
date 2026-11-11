import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const dir=mkdtempSync(path.join(os.tmpdir(),'cd-spell-abilities-'));
try {
 execFileSync('tsc',['--target','es2020','--module','commonjs','--skipLibCheck','--outDir',dir,'lib/ability-generation.ts','lib/creation-choices-2014.ts','lib/rules.ts'],{stdio:'pipe'});
 const ability=(await import('file://'+path.join(dir,'ability-generation.js'))).default;
 const rules=(await import('file://'+path.join(dir,'creation-choices-2014.js'))).default;
 const base={FOR:8,DEX:10,CON:12,INT:15,SAG:14,CHA:13};
 const gnome=ability.finalAbilityScores(base,'Gnome',[],'Gnome des roches');
 assert.equal(gnome.INT,17);
 assert.equal(rules.preparedSpellCountLevelOne2014('Magicien',gnome.SAG,gnome.INT),4);
 assert.equal(rules.preparedSpellCountLevelOne2014('Magicien',base.SAG,base.INT),3);
 const elf=ability.finalAbilityScores(base,'Elfe',[],'Elfe des bois');
 assert.equal(elf.SAG,15);
 assert.equal(rules.preparedSpellCountLevelOne2014('Druide',elf.SAG,elf.INT),3);
 const human=ability.finalAbilityScores(base,'Humain');
 assert.equal(human.SAG,15);
 assert.equal(rules.preparedSpellCountLevelOne2014('Clerc',human.SAG,human.INT),3);
 console.log('6 contrôles de préparation et bonus raciaux réussis');
} finally {rmSync(dir,{recursive:true,force:true});}
