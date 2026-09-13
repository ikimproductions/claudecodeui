import assert from 'node:assert/strict';
import test from 'node:test';

import { firstWordsName, pickSessionName, UNTITLED_CLAUDE_SESSION } from '@/modules/providers/list/claude/session-title.js';

test('the newest ai-title replaces the first-words name an app-created session starts with', () => {
  const name = pickSessionName({
    existing: 'Reply with ok and',
    historyDisplay: 'Reply with ok and nothing else please',
    aiTitles: ['Session discussion', 'Quick acknowledgement check'],
  });
  assert.equal(name, 'Quick acknowledgement check');
});

test('without a history row, the transcript\'s first prompt still marks the four-word app name as derived', () => {
  const name = pickSessionName({ existing: 'Reply with ok and', firstPrompt: 'Reply with ok and nothing else', aiTitles: ['Quick check'] });
  assert.equal(name, 'Quick check');
});

test('a name typed in the app survives re-indexing', () => {
  const name = pickSessionName({
    existing: 'Ilia and Amina talk',
    historyDisplay: 'me manifest ilia back w amina',
    aiTitles: ['Manifesting a relationship'],
  });
  assert.equal(name, 'Ilia and Amina talk');
});

test('an older ai-title counts as derived, so a newer one wins', () => {
  const name = pickSessionName({ existing: 'Session discussion', aiTitles: ['Session discussion', 'Morning pages review'] });
  assert.equal(name, 'Morning pages review');
});

test('a CLI rename beats everything', () => {
  const name = pickSessionName({ existing: 'Typed in app', aiTitles: ['AI title'], customTitle: 'Renamed in the terminal' });
  assert.equal(name, 'Renamed in the terminal');
});

test('without an ai-title the history display is the name, then the last prompt, then Untitled', () => {
  assert.equal(pickSessionName({ historyDisplay: 'do a full deep polish' }), 'do a full deep polish');
  assert.equal(pickSessionName({ lastPrompt: 'later prompt' }), 'later prompt');
  assert.equal(pickSessionName({}), UNTITLED_CLAUDE_SESSION);
  assert.equal(pickSessionName({ existing: UNTITLED_CLAUDE_SESSION, aiTitles: ['Fresh title'] }), 'Fresh title');
});

test('titles are whitespace-collapsed and capped at 120 characters', () => {
  assert.equal(pickSessionName({ aiTitles: ['  two   words \n'] }), 'two words');
  assert.equal(pickSessionName({ aiTitles: ['x'.repeat(200)] }).length, 120);
  assert.equal(firstWordsName('  a  b c d e '), 'a b c d');
});
