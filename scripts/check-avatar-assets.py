"""Verify each configured layered-avatar combination has real, aligned PNG files."""
from pathlib import Path
from PIL import Image
import itertools,sys
ROOT=Path(__file__).resolve().parents[1]/'public/avatars/layers'
COLORS=['','_noir','_blond','_roux','_argente','_violet']
FILES=['01_base/visage_'+s+'.png' for s in ['clair','hale','brun','fonce','lilas']]
FILES+=['06_yeux/'+s+'.png' for s in ['verts','bleus','marron','dores','violets']]
FILES+=['02_cheveux/chauve.png']
FILES += ['02_cheveux/'+s+c+'.png' for s,c in itertools.product(['courts','longs','tresse','queue'],COLORS)]
FILES += ['03_pilosite/'+s+c+'.png' for s,c in itertools.product(['barbe_courte','barbe_longue'],COLORS)]
FILES += ['04_tenue/'+s+'.png' for s in ['robe','cuir','cape','civil']]
FILES += ['05_details/'+s+'.png' for s in ['cicatrice','amulette','boucles','diademe']]
errors=[]
for rel in FILES:
 p=ROOT/rel
 if not p.is_file():errors.append('MISSING '+rel);continue
 try:
  with Image.open(p) as im:
   if im.size!=(480,540) or im.mode!='RGBA':errors.append(f'INVALID {rel}: {im.size}, {im.mode}')
   if im.getchannel('A').getextrema()==(255,255):errors.append('OPAQUE '+rel)
 except Exception as e:errors.append(f'UNREADABLE {rel}: {e}')
if errors:
 print('\n'.join(errors));sys.exit(1)
print(f'OK: {len(FILES)} PNG assets; 480x540 RGBA; transparent; all expected combinations present')
