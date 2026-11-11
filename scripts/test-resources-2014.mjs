import fs from 'node:fs';
import assert from 'node:assert/strict';
const s=fs.readFileSync('lib/resources-2014.ts','utf8');
assert.match(s,/arcane-recovery/);
assert.match(s,/priorMax/);
assert.match(s,/oldDefs/);
assert.match(s,/kind==='long'\|\|c.class_name==='Occultiste'/);
console.log('Resources 2014 structural checks OK');
