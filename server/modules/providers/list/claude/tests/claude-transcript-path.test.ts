import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { encodeClaudeProjectDir, expectedClaudeTranscriptPath } from '@/modules/providers/list/claude/claude-transcript-path.js';

test('a working directory encodes the way the CLI names its project folder', () => {
  assert.equal(encodeClaudeProjectDir('/Users/me/.claude'), '-Users-me--claude');
  assert.equal(encodeClaudeProjectDir('/private/tmp/claude-501/-Users-me/x y'), '-private-tmp-claude-501--Users-me-x-y');
});

test('the expected transcript path lives under the configured Claude home', () => {
  const env = { CLAUDE_CONFIG_DIR: '/cfg' } as NodeJS.ProcessEnv;
  assert.equal(
    expectedClaudeTranscriptPath('/Users/me/proj', 'sid-1', env),
    path.join('/cfg', 'projects', '-Users-me-proj', 'sid-1.jsonl'),
  );
});
