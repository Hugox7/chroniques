#!/usr/bin/env python3
"""Regression checks for campaign page async state and navigation."""
from pathlib import Path
s=(Path(__file__).resolve().parents[1]/'app/campaigns/[id]/page.tsx').read_text()
checks={
 'Sequence guards stale async responses':'generation === loadGeneration.current' in s,
 'Campaign id guard':'currentCampaignId.current === requestedCampaignId' in s,
 'All initial queries report errors':'[a, b, c, d]' in s and 'result.error' in s,
 'Profile query guarded':'if (!stillCurrent()) return;\n      if (profileError)' in s,
 'Invitation query guarded':'if (!stillCurrent()) return;\n        if(invitationError)' in s,
 'Campaign cleared on navigation':'setCampaign(null)' in s,
 'Members cleared on navigation':'setMembers([])' in s,
 'Messages cleared on navigation':'setMessages([])' in s,
 'Old responses invalidated on cleanup':'loadGeneration.current++;\n      s.removeChannel(channel)' in s,
}
for k,v in checks.items():print(('OK' if v else 'FAIL')+' '+k)
raise SystemExit(0 if all(checks.values()) else 1)
