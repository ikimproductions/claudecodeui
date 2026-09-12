import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSettingSources } from '@/modules/providers/list/claude/claude-runtime.provider.js';

test('CLAUDE_SETTING_SOURCES narrows the layers a chat session loads', () => {
  assert.deepEqual(resolveSettingSources('project,local'), ['project', 'local']);
  assert.deepEqual(resolveSettingSources(' project , local ,project'), ['project', 'local']);
});

test('unset or junk keeps the default (user, project, local)', () => {
  assert.deepEqual(resolveSettingSources(undefined), ['project', 'user', 'local']);
  assert.deepEqual(resolveSettingSources('bogus'), ['project', 'user', 'local']);
});
