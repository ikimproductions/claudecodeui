import type { Project } from '@/shared/types';

const normalize = (value: string) => value.replace(/\/+$/, '');

/**
 * The projects the persona picker offers: the configured persona paths that
 * exist in the project list, in the configured order. With no configured
 * paths (or none matching) every project is offered, so the picker never
 * strands the user on a single project.
 */
export function resolvePersonaProjects(personaPaths: readonly string[], projects: readonly Project[]): Project[] {
  const byPath = new Map<string, Project>();
  for (const project of projects) {
    for (const candidate of [project.fullPath, project.path]) {
      if (candidate) byPath.set(normalize(candidate), project);
    }
  }
  const picked: Project[] = [];
  for (const raw of personaPaths) {
    const project = byPath.get(normalize(raw.trim()));
    if (project && !picked.includes(project)) picked.push(project);
  }
  return picked.length > 0 ? picked : [...projects];
}

/**
 * Splits a persona display name such as "🧭 Coach" or "coach" into its emoji
 * and label so the badge can style them separately.
 */
export function splitPersonaLabel(displayName: string): { emoji: string; label: string } {
  const match = displayName.trim().match(/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)\s*(.*)$/u);
  if (match) return { emoji: match[1], label: match[2] || displayName.trim() };
  const trimmed = displayName.trim();
  return { emoji: '', label: trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : '' };
}
