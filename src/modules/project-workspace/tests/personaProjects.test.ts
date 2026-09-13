import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { Project } from '@/shared/types';
import { personaLabelFor, resolvePersonaProjects, splitPersonaLabel } from '@/modules/project-workspace/utils/personaProjects';

const projects: Project[] = [
  { projectId: 'p1', displayName: 'coach', fullPath: '/repo/personas/coach', path: '/repo/personas/coach' },
  { projectId: 'p2', displayName: 'builder', fullPath: '/repo/personas/builder' },
  { projectId: 'p3', displayName: 'other', fullPath: '/elsewhere' },
];

test('configured persona paths pick those projects in order, skipping unknown ones', () => {
  const picked = resolvePersonaProjects(['/repo/personas/builder/', '/missing', '/repo/personas/coach'], projects);
  assert.deepEqual(picked.map((p) => p.projectId), ['p2', 'p1']);
});

test('a single configured persona yields exactly that project (badge without a menu)', () => {
  assert.deepEqual(resolvePersonaProjects(['/repo/personas/coach'], projects).map((p) => p.projectId), ['p1']);
});

test('no configured (or no matching) paths offers every project', () => {
  assert.equal(resolvePersonaProjects([], projects).length, 3);
  assert.equal(resolvePersonaProjects(['/nope'], projects).length, 3);
});

test('persona labels split emoji from name and capitalise bare names', () => {
  assert.deepEqual(splitPersonaLabel('🧭 Coach'), { emoji: '🧭', label: 'Coach' });
  assert.deepEqual(splitPersonaLabel('builder'), { emoji: '', label: 'Builder' });
  assert.deepEqual(splitPersonaLabel('🛠️'), { emoji: '🛠️', label: '🛠️' });
});

test('personaLabelFor prefers the configured label, matched on fullPath or path without a trailing slash', () => {
  const labels = { '/Users/me': '🌐 Global' };
  assert.equal(personaLabelFor({ displayName: 'isaac', fullPath: '/Users/me/', path: '' }, labels), '🌐 Global');
  assert.equal(personaLabelFor({ displayName: 'isaac', fullPath: '', path: '/Users/me' }, labels), '🌐 Global');
  assert.equal(personaLabelFor({ displayName: 'coach', fullPath: '/a/coach', path: '/a/coach' }, labels), 'coach');
});
