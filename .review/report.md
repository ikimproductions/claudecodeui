diff-sha: ba9eacb4c5b33cbee05bb2a5a0f6c4715dae8485
verdict: not-ready
reviewed: claude-stream-events.ts (all), claude-runtime.provider.js hunks + surrounding loop (934-1010), both new tests (ran: 7/7 pass), ActivityIndicator.tsx, spec, client stream path (useChatRealtimeHandlers 180-252/325-345, useSessionStore dedupe/updateStreaming/finalizeStreaming, claude-sessions.provider assistant normalization), dossier scripts/e2e/chat_live.py diff

## Findings (most severe first)
1. dossier scripts/e2e/chat_live.py:385-391 — the "reply streams in several steps" assertion cannot fail: `len` is `document.body.innerText.length` of the whole page, which the activity row itself changes every sample (thinking line rewrites, "9s"→"10s"), plus the user echo landing. Failure: a reply that pops in at once still yields ≥4 distinct lengths and ≥120 growth → PASS. Fix: measure only the last assistant bubble's text length (exclude `[data-testid=transcript-activity]` and the user row), and require ≥4 distinct non-zero bubble lengths before STREAMDONE.
2. src/modules/chat/hooks/useSessionStore.ts:260-290 vs the new stream path — duplicate bubble when the final `assistant` message carries a thinking block: realtime order becomes [text(finalized stream), thinking, text(final)] and `dedupeAdjacentAssistantEchoes` only collapses adjacent rows. Failure: thinking-enabled turn → two identical reply bubbles until the persisted-tail refresh prunes one. Spec claims the existing dedupe covers this and the E2E's `split('STREAMDONE').length >= 3` cannot detect a duplicate (it would be 4). Fix: either verify with the E2E (`== 3`, exactly one reply) or make the dedupe skip over intervening `thinking` rows when comparing the finalized stream text with the final assistant text.
3. src/modules/chat/hooks/useChatRealtimeHandlers.ts:201-203 (reachable now for Claude) — every `stream_delta` for a non-viewed session is appended raw to that session's realtime list (one row per token) with a single shared `accumulatedStreamRef` across sessions. Failure: a Claude turn running in a background session shows dozens of stream_delta rows / mixed text when the user switches to it. Pre-existing for opencode/cursor, but Claude is the main provider and now streams by default. Fix: key the buffer per sessionId and skip the raw append (or coalesce into the `__streaming_<sid>` row).

## Checklist gaps
- "[test] Text block finalized then the full assistant message arrives → one bubble" — the test only asserts the concatenated deltas equal the input; it does not exercise the dedupe and cannot fail on a duplicate (see finding 2).
- "[n/a] Dark mode / phone width — the indicator is unchanged visually" — the diff does change the indicator (truncate, `max-w-[55vw] sm:max-w-md`); the n/a reason is stale.

## Notes
- claude-stream-events.ts logic is sound: parent_tool_use_id filter, per-index block map, throttle with pending flush on thinking stop, 120-char truncation all match the spec; tests cover them and pass.
- `mapCliOptionsToSDK` is now exported only for the test; fine, but the options test imports the whole provider module (heavy) — acceptable, it runs in 0.4 s.
- The first thinking line after a tool status waits for the 150 ms throttle (lastStatus is the tool name, not null); harmless.
- E2E `idle()` relies on `[data-testid=transcript-activity]` (inline variant) — correct for the Astranote iframe layout, resolves immediately when absent.
