# Live token streaming + live thinking status (Claude provider)

Bug: `claude-runtime.provider.js` never sets `includePartialMessages`, so the Agent SDK yields only whole `assistant` messages; the reply pops in at once and the activity row cycles fake words ("Processing…"). The normalizer's `content_block_delta` branch is dead code (the SDK wraps deltas as `{type:'stream_event', event}`).

## Assumptions
- Text streams via the existing `stream_delta` / `stream_end` client path (already used by opencode/cursor); `stream_end` on `content_block_stop` of a text block.
- Thinking streams as `kind: 'status'` frames (`text` = last non-empty line of the thinking so far, throttled ~150 ms server-side) so the activity indicator shows the actual thinking line; the full thinking block still lands in the transcript from the final `assistant` message (unchanged).
- When text starts streaming the status resets to "Writing"; when a tool starts (`content_block_start` tool_use) the status is the tool name ("Read", "Bash"), cleared by the existing flow on `complete`.
- Status line stays one line: ≤ 120 chars, ellipsis, shimmer as today.
- Subagent (`parent_tool_use_id`) stream events are ignored (their text would land in the main thread).

## Edge cases
- [x] [test] `stream_event` with `parent_tool_use_id` → no client frames.
- [x] [test] Thinking delta with only whitespace / no newline yet → status keeps the previous line, never empty.
- [x] [test] Thinking line longer than 120 chars → truncated with "…".
- [x] [test] Text block finalized then the full `assistant` message (thinking + text) arrives → one bubble: `dedupeAdjacentAssistantEchoes` looks past thinking rows (`streamEchoDedupe.test.ts`); chat-live asserts exactly one reply bubble.
- [x] [test] `content_block_stop` for a thinking/tool block never emits `stream_end` (only a text block does).
- [ ] [n/a] Abort mid-stream — existing `complete`/abort path flushes the streaming buffer already.

## UX
- [x] [manual] Reply appears word by word in the Astranote chat; thinking line updates live in the activity row before the first token.
- [x] [test] Status text order per turn: thinking line(s) → "Writing" → tool name → …; `complete` clears (existing).
- [x] [test] Long status line truncates in both indicator variants (`max-w`/`truncate`, `activityIndicatorTruncate.test.tsx`); dark mode untouched.

## Unstated but expected
- [x] [test] Non-Claude providers untouched (their normalizers unchanged; no test change needed beyond running the suite).
- [x] [test] The `message_start`/`message_delta`/`message_stop`/`content_block_start` text events emit nothing (no empty frames).
- [ ] [n/a] Persisted transcript: thinking/text come from the JSONL on reload as before.

## Tests first
- [x] [test] `server/.../tests/claude-stream-events.test.ts`: `normalizeStreamEvent(event, sid)` unit cases above.
- [x] [test] runtime provider passes `includePartialMessages: true` (assert on the built sdkOptions via the exported option builder or a spawn spy).

- [x] [test] Background (non-viewed) Claude session streams into one coalesced row, never one row per token (`backgroundStream.test.tsx`).
