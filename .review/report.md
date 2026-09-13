diff-sha: e8b8735aba019c4aa8ac33e25a912cbedfddd21f
verdict: not-ready
reviewed: spec 2026-09-13-astra-chat-polish-2.md; full `git diff HEAD` (17 files); useSidebarWidth.ts + ProjectSidebarRegion.tsx; sendState.ts, PromptInput.tsx, ChatComposer.tsx (submit/onClick chain, useChatComposerState handleSubmit guard l.614-628, Enter keydown l.1085); MessageComponent.tsx user turn; chatFormatting.ts; SidebarHeader/ViewSwitcher/RecentConversations/Content; shared/ui/Tooltip wrapper; all 5 new/changed test files (ran them: 18/18 pass)

## Findings (most severe first)
1. src/modules/chat/transcript/MessageComponent.tsx:126 — the user-turn action row is `opacity-0` with only `group-hover`/`focus-within` reveal, so on touch devices the timestamp, edit, fork and copy are never visible (before this diff the time was always shown and the buttons at least appeared on the sticky hover of a tap). Failure: open a chat on the phone → no user-turn time, no discoverable edit/fork/copy. Fix: keep the row visible on coarse pointers, e.g. add `[@media(hover:none)]:opacity-100` (or gate `opacity-0` on `isMobile`/`hover:hover`).
2. src/modules/sidebar/SidebarRecentConversations.tsx:172,182 — the age now gets `group-focus-within:invisible`, but `SessionOptions` only reveals on its own `focus-within` / `group-hover` / selected. Failure: Tab onto a non-selected row's link → age vanishes and the `…` stays opacity-0, leaving a blank slot until the next Tab. Fix: add `group-focus-within:opacity-100` to the SessionOptions className (and assert it in recentConversationRowActions.test).
3. src/modules/chat/composer/PromptInput.tsx:231-234 — `recording` state falls through to the ↵ glyph with `type="submit"` while its onClick is `voiceStop({ send: true })`; the old button showed a send arrow. Failure: mic recording → the button reads "press Enter" though Enter is not what it does; harmless functionally (onClick preventDefaults) but the glyph is wrong. Fix: give `recording` its own icon branch (ArrowUp/Send) or document it as intended.

## Checklist gaps
- Spec names `src/modules/chat/tests/composerSendVisibility.test.tsx` and `sidebarWidthPersistence.test.tsx`; actual files are `composerSendState.test.tsx` and `sidebarWidthPersistence.test.ts` — update the spec so the ticked items point at real files.
- "[test] Mobile: the row time is still shown" is covered for the sidebar row only; nothing covers finding 1 (user turn on mobile).
- Two `[manual]` screenshot items remain unticked (sidebar bottom strip, composer alignment) — evidence them or mark deferred.

## Notes
- Enter with a hidden send button is safe: `handleSubmit` (useChatComposerState:623) returns on empty input + no attachments; queued-draft and stop onClick paths are unchanged.
- useSidebarWidth: unmount cleanup cancels (does not flush) a pending write, so a route change within 150 ms of the last move loses that width — within the spec's tolerance, but a flush-on-unmount is one line. Side effect inside the `setWidth` updater (l.775) double-fires under StrictMode; idempotent, fine.
- `relativeTime` is memoised on the timestamp only: "just now" never advances while the transcript stays mounted; `title={formattedTime}` reads "Invalid Date" for a bad stamp.
- Collapse-by-drag path, stale-closure risk (onPointerDown depends on `width`), and post-collapse pointerup (`dragRef` null → return) all check out.
