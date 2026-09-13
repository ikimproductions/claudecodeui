import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { Project } from '@/shared/types';
import { selectedProjectSessions } from '@/modules/project-workspace/utils/projectSessions';

const projects: Project[] = [
  { projectId: 'p1', displayName: 'coach', fullPath: '/repo/coach', sessions: [{ id: 's1', summary: 'One' }, { id: 's2', summary: 'Two' }] },
  { projectId: 'p2', displayName: 'builder', fullPath: '/repo/builder', sessions: [] },
];

test('the session list comes from the projects collection, not the stale selected copy', () => {
  // The session route synthesized the selection before /api/projects landed: no sessions on the copy.
  const synthesized: Project = { projectId: 'p1', displayName: 'coach', fullPath: '/repo/coach', sessions: [] };
  assert.deepEqual(selectedProjectSessions(projects, synthesized).map((s) => s.id), ['s1', 's2']);
});

test('falls back to the copy when the collection lacks the project, and to nothing without a selection', () => {
  const archived: Project = { projectId: 'p9', displayName: 'old', fullPath: '/repo/old', sessions: [{ id: 's9' }] };
  assert.deepEqual(selectedProjectSessions(projects, archived).map((s) => s.id), ['s9']);
  assert.deepEqual(selectedProjectSessions(projects, null), []);
});
