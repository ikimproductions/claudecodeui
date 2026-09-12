/**
 * Parses `PERSONA_PROJECTS` (comma- or newline-separated absolute paths) into
 * the list the persona picker shows. Blank entries are dropped, duplicates kept
 * once, order preserved.
 */
export function parsePersonaProjects(raw: string | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of (raw ?? '').split(/[,\n]/)) {
    const path = entry.trim().replace(/\/+$/, '');
    if (!path || seen.has(path)) continue;
    seen.add(path);
    result.push(path);
  }
  return result;
}

export type WorkspaceConfig = { personaProjects: string[] };

export function buildWorkspaceConfig(environment: NodeJS.ProcessEnv): WorkspaceConfig {
  return { personaProjects: parsePersonaProjects(environment.PERSONA_PROJECTS) };
}
