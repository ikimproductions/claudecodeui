import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorkspaceConfig, parsePersonaLabels, parsePersonaProjects } from '../workspace-config.js';

test('persona projects parse from a comma or newline list, trimmed and de-duplicated', () => {
  assert.deepEqual(parsePersonaProjects(' /a/coach , /a/builder/\n/a/coach,,'), ['/a/coach', '/a/builder']);
});

test('an unset variable yields an empty list', () => {
  assert.deepEqual(buildWorkspaceConfig({}), { personaProjects: [], personaLabels: {} });
  assert.deepEqual(buildWorkspaceConfig({ PERSONA_PROJECTS: '' }), { personaProjects: [], personaLabels: {} });
});

test('an entry may carry a label after a bar; the path list stays plain', () => {
  const raw = '/a/coach|🧭 Coach, /Users/me/|🌐 Global, /a/builder, /a/plain|, /a/odd|x|y';
  assert.deepEqual(parsePersonaProjects(raw), ['/a/coach', '/Users/me', '/a/builder', '/a/plain', '/a/odd']);
  assert.deepEqual(parsePersonaLabels(raw), { '/a/coach': '🧭 Coach', '/Users/me': '🌐 Global', '/a/odd': 'x|y' });
  assert.deepEqual(buildWorkspaceConfig({ PERSONA_PROJECTS: '/a/coach|🧭 Coach' }), { personaProjects: ['/a/coach'], personaLabels: { '/a/coach': '🧭 Coach' } });
});
