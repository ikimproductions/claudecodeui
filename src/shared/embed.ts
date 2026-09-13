/**
 * Embed mode: Astranote mounts the chat as `/?project=<dir>&embed=1[&session=<id>]` inside its
 * floating Astra card. The frame shows the transcript only and talks to its parent through the
 * `astra:*` postMessage bridge (modules/chat/utils/embedBridge.ts).
 */

/** Whether this document was opened as Astranote's embedded transcript frame. */
export function isEmbedded(search: string = typeof window === 'undefined' ? '' : window.location.search): boolean {
  return new URLSearchParams(search).get('embed') === '1';
}

/**
 * The query to keep when the app navigates within an embedded frame (`project` + `embed`), so
 * moving to `/session/<id>` never drops the frame out of embed mode. A one-shot `session` deep
 * link is removed. Empty outside embed mode: the normal app keeps its own URL behaviour.
 */
export function embedSearch(search: string = typeof window === 'undefined' ? '' : window.location.search): string {
  if (!isEmbedded(search)) return '';
  const params = new URLSearchParams(search);
  params.delete('session');
  const out = params.toString();
  return out ? `?${out}` : '';
}

/** `/?…&session=<id>` in embed mode → the `/session/<id>` route to replace it with; null when nothing to do. */
export function embedSessionRedirect(pathname: string, search: string): string | null {
  if (!isEmbedded(search)) return null;
  const session = new URLSearchParams(search).get('session')?.trim();
  if (!session || pathname.replace(/\/+$/, '') !== '') return null;
  return `/session/${encodeURIComponent(session)}${embedSearch(search)}`;
}
