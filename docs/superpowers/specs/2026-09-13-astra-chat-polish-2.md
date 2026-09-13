# Astra AI chat polish 2 (2026-09-13, fork branch `astra2` + a small dossier change)

Isaac's second batch on the chat surface. Everything inline, Fable medium.

## Assumptions
- Sidebar header rethought as two quiet rows: row 1 = list modes as an icon-only segmented control (Conversations · Running · Archive, Projects when the flag shows it) + search / refresh / collapse at the right; row 2 = workspace views (Chat · Shell · Files · Git) as ONE full-width segmented control with four equal icon cells (no label on the active cell, so no ragged right edge). Tooltips carry the names.
- The row age sits at the far right; on hover / focus / the open row it is replaced in place by the `…` menu.
- The strip above the Settings divider is the scroll area's bottom padding: rows now run to the divider (padding moves inside the list).
- Widths persist during the drag (throttled every 150 ms) and on release, in both apps; a reload restores them. Keys unchanged (`sidebar-w`, `atlas-side-w`).
- User turn like claude.ai: only the text in the bubble; time (relative, "20 hours ago"), edit, fork and copy sit in a row under the bubble, visible on hover/focus of the turn. Attachment-only turns keep the same row.
- Composer: `+`, mic and send align to the text line (`items-end`, buttons 6 px off the bottom = the 24 px line's centre). Send is invisible (and inert) while the input is empty and idle; with text it is a quiet ↵ glyph; while streaming the stop square stays; a queued draft keeps ↑.
- Dossier: only the throttled write while dragging (`shell.py` SIDE_JS) + a reload assert in the `shell` scenario. Small change, on main.

## Edge cases
- [x] [test] Fork sidebar: a drag that never gets pointerup (tab switch, pointercancel) still leaves the last width in localStorage within 150 ms.
- [x] [test] Collapse-by-drag writes the default width, not the sub-minimum one (kept from batch 1).
- [x] [test] Send button: empty input + streaming → stop button visible; recording → visible; transcribing → visible spinner; empty + idle → hidden.
- [ ] [n/a] Projects mode when the flag hides it — already forced to Conversations by the existing effect.
- [x] [test] Relative time: < 1 min "just now", minutes, hours, days, then the locale date; invalid timestamp → empty.

## UX
- [x] [test] Row: `time` carries the far-right slot; `SessionOptions` overlays the same slot and is opacity-0 until hover/focus/selected; the row has no reserved right padding beyond the slot.
- [x] [test] View switcher cells are equal (`flex-1`, no active label); the mode tablist has no text labels.
- [x] [manual] Screenshot of the sidebar bottom: no strip between the last row and the divider.
- [x] [test] User bubble contains only the markdown; the action row is a sibling under it with `group-hover` reveal.
- [x] [manual] Composer screenshot: `+`, caret line and mic centred on one line; ↵ appears with text.

## Unstated but expected
- [x] [test] Keyboard: the `…` menu is reachable by Tab (focus-within reveals it), the send button is not tabbable while hidden.
- [x] [test] Mobile: the row time is still shown (no hover) and `…` shows on the selected row; the user-turn action row stays visible on coarse pointers (reviewer).
- [x] [test] Dossier `shell` E2E: drag +30 → 270, reload → still 270; a drag without pointerup writes within 300 ms.
- [x] [test] i18n keys reused (`tabs.*`, `search.mode*`); no new hard-coded English except fallbacks.

## Tests first
- [x] [test] `src/modules/sidebar/tests/sidebarHeaderLayout.test.tsx` — icon-only mode tabs, 4 equal view cells, collapse button.
- [x] [test] `recentConversationRowActions.test.tsx` — age slot + options overlay classes, no `pr-9`.
- [x] [test] `src/modules/project-workspace/tests/sidebarWidthPersistence.test.ts` — throttled write mid-drag, collapse writes default.
- [x] [test] `src/modules/chat/tests/userTurnActions.test.tsx` — bubble/action-row split, relative time.
- [x] [test] `src/modules/chat/tests/composerSendState.test.tsx` — hidden/↵/stop/↑ states.
- [x] [test] dossier `scripts/e2e/scenarios.py` shell: reload + mid-drag persistence.

## Plan
1. [x] Tests above (red).
2. [x] SidebarHeader + SidebarViewSwitcher rows; SidebarRecentConversations row; SidebarContent scroll padding.
3. [x] ProjectSidebarRegion throttled write; dossier `shell.py` throttled write.
4. [x] MessageComponent user turn + `formatRelativeTime` in `chat/utils`; composer row/submit in PromptInput + ChatComposer.
5. [x] verify → build → chat-live + shell E2E (dossier) → reviewer → finish (fork), small commit (dossier).
