import assert from 'node:assert/strict';

import { test } from 'vitest';

import { greetingKey } from '@/modules/chat/transcript/WelcomeEmptyState';

test('greeting follows the hour', () => {
  assert.equal(greetingKey(0), 'morning');
  assert.equal(greetingKey(11), 'morning');
  assert.equal(greetingKey(12), 'afternoon');
  assert.equal(greetingKey(17), 'afternoon');
  assert.equal(greetingKey(18), 'evening');
  assert.equal(greetingKey(23), 'evening');
});
