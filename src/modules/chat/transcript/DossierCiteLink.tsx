import type { MouseEvent, ReactNode } from 'react';

/** Message posted to the embedding Atlas page, which opens the player or the note. */
export const DOSSIER_OPEN_MESSAGE = 'dossier:open';

const CITE_RE = /^(rec|note):/i;

export function isDossierCiteHref(href?: string): href is string {
  return !!href && CITE_RE.test(href);
}

export function citeKind(href: string): 'rec' | 'note' {
  return href.toLowerCase().startsWith('note:') ? 'note' : 'rec';
}

/**
 * Sends a citation to whoever embeds the chat. Inside Atlas that opens the
 * player at the second (`rec:ID?t=SEC&e=SEC`) or the Apple Note at the offset
 * (`note:UUID?at=OFFSET&len=N`); standalone there is nothing to open.
 */
export function openDossierCite(href: string): boolean {
  if (typeof window === 'undefined' || window.parent === window) return false;
  window.parent.postMessage({ type: DOSSIER_OPEN_MESSAGE, href }, '*');
  return true;
}

function CiteGlyph({ kind }: { kind: 'rec' | 'note' }) {
  if (kind === 'note') {
    return (
      <svg viewBox="0 0 16 16" className="h-[11px] w-[11px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 2.5h6l2.5 2.5v8.5H4z" /><path d="M6.5 8h4M6.5 10.5h4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="h-[10px] w-[10px] shrink-0" fill="currentColor" aria-hidden>
      <path d="M4.5 2.8v10.4L13 8z" />
    </svg>
  );
}

/**
 * Rendered by Markdown for `rec:` and `note:` links: a quiet pill that opens
 * the recording at the quoted second, or the note, in the surrounding Atlas.
 */
export function DossierCiteLink({ href, children }: { href: string; children?: ReactNode }) {
  const kind = citeKind(href);
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    openDossierCite(href);
  };
  return (
    <a
      href={href}
      data-cite={kind}
      onClick={onClick}
      title={kind === 'rec' ? 'Play this moment' : 'Open this note'}
      className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-1.5 py-px align-[1px] text-[11.5px] font-medium tabular-nums leading-4 text-foreground/75 no-underline transition-colors hover:border-border hover:bg-muted hover:text-foreground"
    >
      <CiteGlyph kind={kind} />
      <span>{children}</span>
    </a>
  );
}
