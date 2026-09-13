/**
 * Which name a Claude session shows in the sidebar.
 *
 * Claude Code writes the title it generates for a conversation into the
 * session transcript (`{"type":"ai-title","aiTitle":…}`), so the app never has
 * to ask a model for one. A `custom-title` row is a rename typed in the CLI and
 * wins outright. A name typed in the app (one that matches none of the derived
 * candidates) is kept. Otherwise the newest AI title replaces whatever the row
 * started with — the first words of the first message, or "Untitled".
 */

export const UNTITLED_CLAUDE_SESSION = 'Untitled Claude Session';

const MAX_TITLE_LENGTH = 120;
/** Mirrors the four-word name the app gives a brand-new session before any transcript exists. */
const MAX_APP_NAME_WORDS = 4;

export type SessionTitleSources = {
  /** The row's current `custom_name`, if the session is already indexed. */
  existing?: string | null;
  /** The `display` text from `history.jsonl`: the first prompt. */
  historyDisplay?: string;
  /** Every `ai-title` in the transcript, oldest first. */
  aiTitles?: string[];
  /** The last `custom-title` in the transcript (a CLI rename). */
  customTitle?: string;
  /** The last `last-prompt` row, the weakest fallback. */
  lastPrompt?: string;
  /** The first user prompt in the transcript: what the app's four-word name was cut from. */
  firstPrompt?: string;
};

const clean = (value: string | null | undefined): string => (value ?? '').replace(/\s+/g, ' ').trim();

/** The name an app-created row starts with: the first four words of the message. */
export function firstWordsName(message: string | undefined): string {
  return clean(message).split(' ').filter(Boolean).slice(0, MAX_APP_NAME_WORDS).join(' ');
}

export function pickSessionName(sources: SessionTitleSources): string {
  const customTitle = clean(sources.customTitle);
  if (customTitle) {
    return customTitle.slice(0, MAX_TITLE_LENGTH);
  }

  const existing = clean(sources.existing);
  const history = clean(sources.historyDisplay);
  const aiTitles = (sources.aiTitles ?? []).map(clean).filter(Boolean);
  const latestAiTitle = aiTitles.at(-1) ?? '';

  // Names the app or the indexer could have produced on its own. Anything else
  // in `existing` was typed by the user and must survive a re-index.
  const firstPrompt = clean(sources.firstPrompt);
  const derived = new Set<string>([
    UNTITLED_CLAUDE_SESSION,
    'Untitled Session',
    history,
    history.slice(0, MAX_TITLE_LENGTH),
    firstWordsName(history),
    firstPrompt,
    firstPrompt.slice(0, MAX_TITLE_LENGTH),
    firstWordsName(firstPrompt),
    ...aiTitles,
    ...aiTitles.map((title) => title.slice(0, MAX_TITLE_LENGTH)),
  ]);
  derived.delete('');

  if (existing && !derived.has(existing)) {
    return existing.slice(0, MAX_TITLE_LENGTH);
  }

  const name = latestAiTitle || existing || history || clean(sources.lastPrompt) || UNTITLED_CLAUDE_SESSION;
  return name.slice(0, MAX_TITLE_LENGTH);
}
