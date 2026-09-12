#!/bin/bash
# [ai] Atlas fork verify: server tests (explicit file list — node 20 does not expand the npm test glob) + client tests → PASS/FAIL, exit code authoritative.
# Node 20's runner sometimes drops a whole file with "Unable to deserialize cloned data" (IPC flake under load); such files are rerun alone once.
# Usage: scripts/verify.sh [server|client]      (build separately: VITE_IS_PLATFORM=true npm run build)
set -uo pipefail; cd "$(dirname "$0")/.."; LOG=/tmp/claudecodeui-verify.log; : > "$LOG"; what="${1:-all}"; rc=0; note=""
T="npx tsx --tsconfig server/tsconfig.json --test"
if [ "$what" = all ] || [ "$what" = server ]; then
  $T $(find server -name '*.test.ts' -o -name '*.test.js' | tr '\n' ' ') >>"$LOG" 2>&1 || rc=1
  if [ $rc = 1 ]; then
    flaky=$(grep -E "^not ok [0-9]+ - /.*\.test\.(ts|js)$" "$LOG" | sed -E 's/^not ok [0-9]+ - //'); other=$(grep -E "^not ok" "$LOG" | grep -vE "^not ok [0-9]+ - /.*\.test\.(ts|js)$" | wc -l | tr -d ' ')
    if [ -n "$flaky" ] && [ "$other" = 0 ]; then
      rc=0; for f in $flaky; do $T "$f" >>"$LOG" 2>&1 || rc=1; done; note="(reran alone: $(echo $flaky | xargs -n1 basename | tr '\n' ' '))"
    fi
  fi
fi
if [ "$what" = all ] || [ "$what" = client ]; then npx vitest run >>"$LOG" 2>&1 || rc=1; fi
if [ $rc = 0 ]; then echo "PASS $(grep -E '^# pass|Tests +[0-9]+ passed' "$LOG" | tr -s ' ' | tr '\n' ' ') $note"; else echo "FAIL"; grep -E "^not ok|FAIL |^Error" "$LOG" | head -20; fi
exit $rc
