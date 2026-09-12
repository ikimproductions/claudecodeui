import type { Project } from '@/shared/types';

const normalize = (value: string): string => value.trim().replace(/\/+$/, '');

/**
 * `/?project=<absolute path>` (used by external launchers such as Atlas persona links) names the
 * project to open. Returns the matching project, or null when the parameter is missing or unknown.
 */
export function resolveProjectFromSearch(search: string, projects: Project[]): Project | null {
  const wanted = new URLSearchParams(search).get('project');
  if (!wanted) return null;
  const target = normalize(wanted);
  if (!target) return null;
  return projects.find((project) => normalize(project.fullPath || project.path || '') === target) ?? null;
}
