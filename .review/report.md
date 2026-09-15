diff-sha: 05dd5d18db14fdd0188fd13b39cd46a24780a8bb
reviewer: inline
verdict: ready
tier: 2

## Codex BLOCKING
1. Edge-case tests missing (run 1) — fixed: service empty-project test, body error/empty-state test, hook tests for abort mid-flight, error response, cut subtree (src/modules/file-tree/tests/*). Runs 2–3 refined the abort/subtree tests; run 4: PASS, none.

## Merge review (architecture fit, plan conformance, edge cases)
- Owner module respected: the shape change lives in server/modules/file-tree (service + types) and src/modules/file-tree (helper, hook, body); the three outside consumers only unpack through readFileTreeResponse — no parallel path.
- Plan conformance: spec T1–T4 all ticked; one response shape for root and subtree; banner in FileTreeBody; en key only (fallbackLng en).
- Edge cases: empty (service + body tests), exactly 10,000 (service), cut subtree keeps its row flag (hook test; graftChildren now preserves it), bare-array tolerance + garbage (helper tests), abort (hook test), error hides banner (hook + body tests).
- Not covered by a test: the 10 other locales fall back to English for the new key (config behaviour, not this diff).
- QA (hands, headless Playwright, 10,001-file fixture): 10,000 rows + the line shown, 5-file project shows none, palette search and @-mentions still list files. No findings.
- Lint: the pre-existing react(set-state-in-effect) warning in useFileTreeData is untouched by this diff.

## Checklist
1 PASS 2 PASS 3 PASS 4 PASS (no test removed) 5 PASS (no new import outside allowed, no dependency) 6 PASS 7 N-A 8 N-A 9 PASS 10 PASS

- Post-review additions reviewed inline: scripts/finish.sh (project-bootstrap template, verbatim), .gitignore (.review/.hands/docs/qa/shots), docs/learnings.md.
