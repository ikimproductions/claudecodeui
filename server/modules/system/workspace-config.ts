/**
 * Parses `PERSONA_PROJECTS` (comma- or newline-separated absolute paths) into
 * the list the persona picker shows. Blank entries are dropped, duplicates kept
 * once, order preserved.
 */
export function parsePersonaProjects(raw: string | undefined): string[] {
  return parsePersonaEntries(raw).map((entry) => entry.path);
}

/**
 * An entry may carry a display label after a bar — `/srv/personas/coach|🧭 Coach` — for the
 * badge and the switch menu; without one the project's own display name is shown.
 */
export function parsePersonaLabels(raw: string | undefined): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const { path, label } of parsePersonaEntries(raw)) if (label) labels[path] = label;
  return labels;
}

function parsePersonaEntries(raw: string | undefined): { path: string; label: string }[] {
  const seen = new Set<string>();
  const result: { path: string; label: string }[] = [];
  for (const entry of (raw ?? '').split(/[,\n]/)) {
    const bar = entry.indexOf('|');
    const path = (bar >= 0 ? entry.slice(0, bar) : entry).trim().replace(/\/+$/, '');
    const label = bar >= 0 ? entry.slice(bar + 1).trim() : '';
    if (!path || seen.has(path)) continue;
    seen.add(path);
    result.push({ path, label });
  }
  return result;
}

export type WorkspaceConfig = { personaProjects: string[]; personaLabels: Record<string, string> };

export function buildWorkspaceConfig(environment: NodeJS.ProcessEnv): WorkspaceConfig {
  return {
    personaProjects: parsePersonaProjects(environment.PERSONA_PROJECTS),
    personaLabels: parsePersonaLabels(environment.PERSONA_PROJECTS),
  };
}
