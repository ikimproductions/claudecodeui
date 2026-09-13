import assert from 'node:assert/strict';
import test from 'node:test';

import { isGlobalProject, parseGlobalProjects, sessionScope } from '@/modules/providers/list/claude/claude-session-scope.js';

const isolated = { CLAUDE_SETTING_SOURCES: 'local', CLAUDE_INLINE_MEMORY: '1', GLOBAL_PROJECTS: '/Users/me, /srv/all/', PATH: '/bin' };

test('global projects parse trimmed, de-duplicated, without trailing slashes', () => {
  assert.deepEqual(parseGlobalProjects(' /Users/me , /srv/all/\n/Users/me,,'), ['/Users/me', '/srv/all']);
  assert.deepEqual(parseGlobalProjects(undefined), []);
});

test('a global cwd matches with or without a trailing slash', () => {
  const list = parseGlobalProjects(isolated.GLOBAL_PROJECTS);
  assert.equal(isGlobalProject('/Users/me/', list), true);
  assert.equal(isGlobalProject('/srv/all', list), true);
  assert.equal(isGlobalProject('/Users/me/sub', list), false);
  assert.equal(isGlobalProject(undefined, list), false);
});

test('a global project loads every settings layer, no inline memory, and a child env without the narrowing variables', () => {
  const scope = sessionScope(isolated, '/Users/me');
  assert.deepEqual(scope.settingSources, ['project', 'user', 'local']);
  assert.equal(scope.inlineMemory, false);
  assert.equal('CLAUDE_SETTING_SOURCES' in scope.env, false);
  assert.equal('CLAUDE_INLINE_MEMORY' in scope.env, false);
  assert.equal(scope.env.PATH, '/bin');
});

test('every other project keeps the isolated behaviour', () => {
  const scope = sessionScope(isolated, '/Users/me/personas/coach');
  assert.deepEqual(scope.settingSources, ['local']);
  assert.equal(scope.inlineMemory, true);
  assert.equal(scope.env.CLAUDE_SETTING_SOURCES, 'local');
});

test('GLOBAL_PROJECTS unset changes nothing', () => {
  const { GLOBAL_PROJECTS: _g, ...env } = isolated;
  assert.equal(sessionScope(env, '/Users/me').inlineMemory, true);
  assert.equal(sessionScope({ PATH: '/bin' }, '/Users/me').inlineMemory, false);
  assert.deepEqual(sessionScope({ PATH: '/bin' }, '/Users/me').settingSources, ['project', 'user', 'local']);
});
