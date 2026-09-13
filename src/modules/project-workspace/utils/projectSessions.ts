import type { Project, ProjectSession } from '@/shared/types';

/**
 * The selected project's live session list. `selectedProject` is a denormalized copy that only keeps
 * workspace metadata in step (projectSelectionMetadata.ts) — its `sessions` go stale, and the session
 * route can synthesize a copy with none at all when the details lookup beats `/api/projects`. The
 * sidebar's `projects` collection is the one the watcher upserts into, so it is the source of truth
 * (Astranote's history sheet reads this through the embed bridge).
 */
export function selectedProjectSessions(
  projects: readonly Project[],
  selectedProject: Project | null | undefined,
): readonly ProjectSession[] {
  if (!selectedProject) return [];
  const live = projects.find((project) => project.projectId === selectedProject.projectId);
  return live?.sessions ?? selectedProject.sessions ?? [];
}
