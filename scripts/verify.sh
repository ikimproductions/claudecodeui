#!/bin/bash
# [ai] Atlas fork verify: server tests (explicit file list — node 20 does not expand the npm test glob) + client tests → PASS/FAIL, exit code authoritative.
# Usage: scripts/verify.sh [server|client]      (build separately: VITE_IS_PLATFORM=true npm run build)
set -uo pipefail; cd "$(dirname "$0")/.."; LOG=/tmp/claudecodeui-verify.log; : > "$LOG"; what="${1:-all}"; rc=0
if [ "$what" = all ] || [ "$what" = server ]; then
  npx tsx --tsconfig server/tsconfig.json --test $(find server -name '*.test.ts' -o -name '*.test.js' | tr '\n' ' ') >>"$LOG" 2>&1 || rc=1
fi
if [ "$what" = all ] || [ "$what" = client ]; then npx vitest run >>"$LOG" 2>&1 || rc=1; fi
if [ $rc = 0 ]; then echo "PASS $(grep -E '^# pass|Tests +[0-9]+ passed' "$LOG" | tr -s ' ' | tr '\n' ' ')"; else echo "FAIL"; grep -E "^not ok|FAIL |Error" "$LOG" | head -20; fi
exit $rc
