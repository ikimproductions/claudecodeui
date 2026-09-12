import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWorkspaceConfig, parsePersonaProjects } from '../workspace-config.js';

test('persona projects parse from a comma or newline list, trimmed and de-duplicated', () => {
  assert.deepEqual(parsePersonaProjects(' /a/coach , /a/builder/\n/a/coach,,'), ['/a/coach', '/a/builder']);
});

test('an unset variable yields an empty list', () => {
  assert.deepEqual(buildWorkspaceConfig({}), { personaProjects: [] });
  assert.deepEqual(buildWorkspaceConfig({ PERSONA_PROJECTS: '' }), { personaProjects: [] });
});
