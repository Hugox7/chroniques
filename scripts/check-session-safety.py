#!/usr/bin/env python3
"""Static regression checks; not a replacement for live Supabase integration tests."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
ui=(root/'components/game-sessions.tsx').read_text()
sql=(root/'supabase/migrations/20261108007000_consolidation_guards.sql').read_text()
checks={
 'confirmation before deletion': 'if(!confirm(message))return;' in ui,
 'single lock across deletion': 'inFlight.current=true;setBusy(true)' in ui and 'finally{inFlight.current=false;setBusy(false)}' in ui,
 'destructive confirmation RPC': "p_confirm_data_loss:destructive" in ui,
 'server refuses active session deletion': "if v_status='active' then" in sql,
 'server checks event and snapshot counts': 'v_events>0 or v_snapshots>0' in sql,
 'server checks campaign ownership': 'public.owns_campaign(v_campaign)' in sql,
 'realtime load sequence guard': 'if(sequence!==loadSequence.current)return;' in ui,
 'realtime subscription cleanup': 'loadSequence.current++;void db.removeChannel(channel)' in ui,
}
for name,ok in checks.items():print(('OK' if ok else 'FAIL')+' '+name)
if not all(checks.values()):raise SystemExit(1)
