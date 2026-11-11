/** Rebuilds an auditable feature-by-level index from the downloaded 2014 API JSON.
 * Does not invent class-specific resources or claim API /levels coverage.
 * Usage: node scripts/build-class-progression-2014.mjs /path/to/data.zip
 */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const zip=process.argv[2];
if(!zip || !fs.existsSync(zip)) throw new Error('Provide existing data.zip');
const py=`import json,sys,zipfile\nz=zipfile.ZipFile(sys.argv[1]); p=next((p for p in z.namelist() if p.endswith('/dnd5eapi/2014/features.json')),None)\nif not p: raise SystemExit('Missing 2014 features')\nprint(z.read(p).decode())`;
const features=JSON.parse(execFileSync('python3',['-c',py,zip],{maxBuffer:15*1024*1024,encoding:'utf8'}));
const classes=['barbarian','bard','cleric','druid','fighter','monk','paladin','ranger','rogue','sorcerer','warlock','wizard'];
const output={ruleset:'2014',source:'dnd5eapi/2014/features.json',scope:'class and subclass feature index; not authoritative /levels progression',classes:{}};
for(const id of classes){
 const entries=features.filter(f=>f.class?.index===id && Number.isInteger(f.level) && f.level>=1 && f.level<=20);
 output.classes[id]=Array.from({length:20},(_,i)=>({level:i+1,proficiencyBonus:2+Math.floor(i/4),features:entries.filter(f=>f.level===i+1).map(f=>({id:f.index,name:f.name,subclass:f.subclass?.index??null})).sort((a,b)=>a.id.localeCompare(b.id))}));
}
const dest=path.resolve('data/rulesets/2014/class-features-by-level.json');fs.writeFileSync(dest,JSON.stringify(output,null,2)+'\n');
console.log(`Wrote ${dest}: ${classes.length} classes, ${features.length} source features`);
