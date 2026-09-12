import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { claudeHome, claudeJsonPath, claudeProjectsRoot } from '@/shared/claude-home.js';

test('falls back to ~/.claude when CLAUDE_CONFIG_DIR is unset or blank', () => {
  assert.equal(claudeHome({}), path.join(os.homedir(), '.claude'));
  assert.equal(claudeHome({ CLAUDE_CONFIG_DIR: '  ' }), path.join(os.homedir(), '.claude'));
  assert.equal(claudeProjectsRoot({}), path.join(os.homedir(), '.claude', 'projects'));
  assert.equal(claudeJsonPath({}), path.join(os.homedir(), '.claude.json'));
});

test('derives every Claude path from CLAUDE_CONFIG_DIR when set', () => {
  const env = { CLAUDE_CONFIG_DIR: '/tmp/acct/' };
  assert.equal(claudeHome(env), path.resolve('/tmp/acct'));
  assert.equal(claudeProjectsRoot(env), path.resolve('/tmp/acct/projects'));
  assert.equal(claudeJsonPath(env), path.resolve('/tmp/acct/.claude.json'));
});
