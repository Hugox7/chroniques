#!/usr/bin/env python3
"""Offline contract audit; not a replacement for a running Supabase integration test."""
from pathlib import Path
import re,sys
ROOT=Path(__file__).resolve().parents[1]
fail=[]
def verify(ok,label):
 print(('PASS ' if ok else 'FAIL ')+label)
 if not ok:fail.append(label)
code='\n'.join(p.read_text(encoding='utf-8') for folder in ('app','components','lib') for p in (ROOT/folder).rglob('*.tsx'))
sql='\n'.join(p.read_text(encoding='utf-8') for p in (ROOT/'supabase/migrations').glob('*.sql'))
functions=set(re.findall(r'create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z_][a-z_0-9]*)',sql,re.I))
static=set(re.findall(r'\.rpc\(\s*[\"\']([a-z_][a-z_0-9]*)',code,re.I))
# Also catch RPC names passed through the GameSessions action helper.
static.update(re.findall(r'\baction\(\s*[\"\']((?:start|finish)_game_session)',(ROOT/'components/game-sessions.tsx').read_text(),re.I))
for name in sorted(static):verify(name in functions,'RPC implemented in migrations: '+name)
required=['app/login/page.tsx','app/dashboard/page.tsx','app/characters/new/page.tsx','app/characters/[id]/page.tsx','app/campaigns/new/page.tsx','app/campaigns/[id]/page.tsx','components/game-sessions.tsx','components/campaign-character-control.tsx']
for name in required:verify((ROOT/name).is_file(),'Journey screen: '+name)
migrations=sorted((ROOT/'supabase/migrations').glob('*.sql'))
verify(len(migrations)>=15,'Migration history present')
verify(len({m.name[:14] for m in migrations})==len(migrations),'Unique migration timestamps')
verify((ROOT/'.env.example').exists(),'Environment template included')
print(f'\n{len(static)} RPC contracts checked; {len(fail)} failures')
sys.exit(bool(fail))
