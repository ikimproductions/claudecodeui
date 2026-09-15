#!/bin/bash
# desc: finish a task in ONE round: verify.sh → e2e scenarios → fresh-review gate → stage → commit with trailers (PUSH=1 pushes)
# [ai] Gates (2026-09-10, tiers 2026-09-14): a non-trivial diff (>= 20 code lines) needs what `review-gate tier` demands — .review/codex.md (tier 1+), .review/report.md (tier 2+, `reviewer: fresh` at tier 3) — then
# fresh-context reviewer, and — when scripts/e2e.sh exists — either --e2e <a,b> (run here) or --no-e2e "<reason>" (recorded).
# Usage: scripts/finish.sh [--e2e a,b] [--no-e2e "<reason>"] [--allow-fixes | --re-reviewed] [--checkpoint] "<commit message>" [paths...]
set -uo pipefail; cd "$(dirname "$0")/.."
E2E=""; NOE2E=""; AF=""
while [ $# -gt 0 ]; do case "$1" in --e2e) E2E=${2:-}; shift 2;; --no-e2e) NOE2E=${2:-}; shift 2;; --allow-fixes) AF="$AF --allow-fixes"; shift;; --re-reviewed) AF="$AF --re-reviewed"; shift;; --checkpoint) AF="$AF --checkpoint"; shift;; *) break;; esac; done
MSG=${1:?commit message}; shift; PATHS=("$@"); [ ${#PATHS[@]} -eq 0 ] && PATHS=(src server tests docs scripts todo CLAUDE.md AGENTS.md .gitignore)
GATE=$(command -v review-gate 2>/dev/null || echo "$HOME/bin/review-gate")
scripts/verify.sh >/dev/null 2>&1 || { echo "FAIL verify.sh — not committing"; tail -20 .verify.log 2>/dev/null; exit 1; }
[ -x "$GATE" ] || { echo "FAIL: ~/bin/review-gate not installed (chezmoi apply) — not committing"; exit 1; }
N=$("$GATE" size 2>/dev/null || echo 0); TRIVIAL=0; [ "$N" -lt 20 ] && TRIVIAL=1
TRAILER=""
if [ -n "$E2E" ]; then   # E2E runs BEFORE the hash check so anything a scenario writes is part of the reviewed diff
  mkdir -p .review; for s in ${E2E//,/ }; do scripts/e2e.sh "$s" > .review/e2e-$s.log 2>&1 || { echo "FAIL e2e $s — not committing"; tail -20 .review/e2e-$s.log; exit 1; }; tail -1 .review/e2e-$s.log; done
  TRAILER="E2E: $E2E"
elif [ -n "$NOE2E" ]; then TRAILER="E2E-skipped: $NOE2E"
elif [ -x scripts/e2e.sh ] && [ $TRIVIAL = 0 ]; then
  echo "FAIL: non-trivial change and scripts/e2e.sh exists — rerun with --e2e <scenario[,scenario]> (add the scenario if none covers this change) or --no-e2e \"<why nothing user-visible changed>\""; exit 1
fi
R=$("$GATE" check $AF) || { echo "FAIL review gate — not committing: $R"; exit 1; }
case "$R" in trivial*) R="Reviewed: trivial";; esac
TRAILER="$R"${TRAILER:+$'\n'"$TRAILER"}
grep -qs '^\.review/' .gitignore || echo '.review/' >> .gitignore
for p in "${PATHS[@]}"; do [ -e "$p" ] && git add -- "$p"; done
git status --short | grep -v '^?? \.review' | head -20
git commit -q -m "$MSG" -m "$TRAILER" && echo "committed $(git rev-parse --short HEAD)" || { echo "nothing to commit"; exit 1; }
rm -rf .review
[ "${PUSH:-0}" = 1 ] && git push -q && echo pushed
exit 0
