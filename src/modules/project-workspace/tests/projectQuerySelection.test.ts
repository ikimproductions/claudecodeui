import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { Project } from '@/shared/types';
import { resolveProjectFromSearch } from '@/modules/project-workspace/utils/projectQuerySelection';

const projects: Project[] = [
  { projectId: 'p1', displayName: 'coach', fullPath: '/repo/personas/coach', path: '/repo/personas/coach' },
  { projectId: 'p2', displayName: 'builder', fullPath: '/repo/personas/builder' },
];

test('selects the project whose path matches ?project=', () => {
  assert.equal(resolveProjectFromSearch('?project=%2Frepo%2Fpersonas%2Fbuilder', projects)?.projectId, 'p2');
  assert.equal(resolveProjectFromSearch('?project=/repo/personas/coach/', projects)?.projectId, 'p1');
});

test('unknown, blank or missing ?project= selects nothing', () => {
  assert.equal(resolveProjectFromSearch('?project=/elsewhere', projects), null);
  assert.equal(resolveProjectFromSearch('?project=', projects), null);
  assert.equal(resolveProjectFromSearch('', projects), null);
});
