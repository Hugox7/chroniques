import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const dir=mkdtempSync(path.join(os.tmpdir(),'cd-races-'));
try {
 execFileSync('tsc',['--target','es2020','--module','commonjs','--skipLibCheck','--outDir',dir,'lib/ability-generation.ts'],{stdio:'pipe'});
 const a=require(path.join(dir,'ability-generation.js'));
 const r=require(path.join(dir,'rules.js'));
 let checks=0;
 for(const race of r.races){
  const subs=a.subraceOptions(race);
  const choices=race==='Demi-elfe'?['FOR','DEX']:[];
  for(const sub of subs.length?subs:['']){
   const scores=a.finalAbilityScores(r.initialAbilities,race,choices,sub);
   assert.ok(r.abilities.every(x=>Number.isInteger(scores[x])&&scores[x]>=8&&scores[x]<=17));checks++;
  }
  assert.equal(a.validSubrace(race,'Sous-espèce inconnue'),false);checks++;
 }
 assert.equal(a.validHalfElfChoices('Humain',['FOR','DEX']),false);checks++;
 assert.equal(a.validHalfElfChoices('Demi-elfe',['CHA','DEX']),false);checks++;
 assert.equal(a.validSubrace('Humain','Haut elfe'),false);checks++;
 console.log(`${checks} contrôles raciaux 2014 réussis`);
}finally{rmSync(dir,{recursive:true,force:true});}
