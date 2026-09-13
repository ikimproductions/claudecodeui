# Repository guidance

## Backend code

For every task that creates, modifies, refactors, or reviews backend code under `server/`, load and follow `$backend-module-standards` from `.agents/skills/backend-module-standards/SKILL.md`. Apply it only to backend code; do not impose those architecture rules on the frontend.

## Frontend code

For every task that creates, modifies, refactors, or reviews frontend code under `src/`, load and follow `$frontend-module-standards` from `.agents/skills/frontend-module-standards/SKILL.md`. Apply it only to frontend code; do not impose those architecture rules on the backend.

## Embed mode (Astranote's floating Astra card)

`/?project=<dir>&embed=1[&session=<id>]` (`src/shared/embed.ts`) renders the transcript only: no sidebar, header, tabs, palette or quick settings, the composer mounted but hidden, transparent ground (`html.embed`). The parent drives the frame over `postMessage` (`src/modules/chat/utils/embedBridge.ts`, hook `useEmbedBridge`): in `astra:send {content, options:{provider?, model?, effort?}, files?}`, `astra:abort`, `astra:new`, `astra:model {provider, model, effort}`, `astra:transcribe {blob, name}`, `astra:sessions` (ask for the list), `astra:open {sessionId}` (show that conversation); out `astra:sessions {sessions:[{id, title, updatedAt}]}` (the project's conversations, newest first, posted whenever they change), `astra:ready {catalog, provider, model, effort}`, `astra:session {sessionId}`, `astra:state {streaming}`, `astra:transcript {text}`, `astra:error {message}` (plus `dossier:open`). `?session=` redirects to `/session/<id>`; in-app navigation (including New chat) keeps `project` + `embed`. The frame URL also carries `&origin=<parent origin>`: the bridge ignores commands from any other origin, posts only to it, and stays off without it; the server sends `Content-Security-Policy: frame-ancestors 'self' $EMBED_ORIGINS` (default `http://localhost:* http://127.0.0.1:*`). Keep the message names in step with Astranote `app/client/chat/pill.js`.
