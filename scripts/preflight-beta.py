#!/usr/bin/env python3
"""Offline preflight for the complete Chroniques & Dés beta source tree."""
from pathlib import Path
from PIL import Image
import re, subprocess, sys, zipfile
ROOT=Path(__file__).resolve().parents[1]
failures=[]
def check(condition, description):
 print(('OK  ' if condition else 'FAIL')+description)
 if not condition:failures.append(description)
for file in ['package.json','tsconfig.json','app/layout.tsx','app/page.tsx','components/avatar-builder.tsx','lib/supabase.ts','.env.example']:
 check((ROOT/file).is_file(), 'Core file: '+file)
check(len(list((ROOT/'app').rglob('page.tsx')))>=8,'Eight or more application pages')
migrations=list((ROOT/'supabase/migrations').glob('*.sql'))
check(len(migrations)>=10,'Database migrations included')
check(len({p.name for p in migrations})==len(migrations),'No duplicate migration names')
assets=list((ROOT/'public/avatars/layers').rglob('*.png'))
check(len(assets)>=55,'Avatar PNG layer library present')
for f in assets:
 try:
  with Image.open(f) as im:
   if im.size!=(480,540) or im.mode!='RGBA':failures.append('Bad PNG format: '+str(f))
 except Exception as e:failures.append('Unreadable PNG: '+str(f)+' '+str(e))
check(not any('PNG' in e for e in failures),'All PNG layers are readable 480×540 RGBA')
for name in ['guerrier','aventuriere']:
 p=ROOT/f'public/avatars/portraits/{name}.webp'
 check(p.is_file(),'Painted portrait '+name)
code=(ROOT/'components/avatar-builder.tsx').read_text()
for marker in ['readAvatar','writeAvatar','AvatarPortrait','AvatarBuilder','exportPortrait','undoStack','redoStack']:
 check(marker in code,'Avatar integration: '+marker)
check('CD_AVATAR_V1:' in code,'Avatar serialization format unchanged')
check('painted?720:540' in code,'Painted export keeps 2:3 aspect ratio')
print(f'\n{len(failures)} preflight failures')
if failures:
 print('\n'.join(failures));sys.exit(1)
