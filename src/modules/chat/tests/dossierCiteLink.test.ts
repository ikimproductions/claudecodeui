import assert from 'node:assert/strict';

import { test } from 'vitest';

import { citeKind, isDossierCiteHref } from '@/modules/chat/transcript/DossierCiteLink';

test('rec: and note: hrefs are citations, everything else is not', () => {
  assert.equal(isDossierCiteHref('rec:abc?t=12.5&e=20'), true);
  assert.equal(isDossierCiteHref('note:UUID?at=10&len=40'), true);
  assert.equal(isDossierCiteHref('https://example.com'), false);
  assert.equal(isDossierCiteHref('src/foo.ts'), false);
  assert.equal(isDossierCiteHref(undefined), false);
});

test('the glyph follows the scheme', () => {
  assert.equal(citeKind('rec:abc?t=1'), 'rec');
  assert.equal(citeKind('NOTE:abc?at=1'), 'note');
});
