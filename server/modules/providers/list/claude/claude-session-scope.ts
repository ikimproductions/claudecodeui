const normalize = (value: string) => value.trim().replace(/\/+$/, '');

/**
 * `GLOBAL_PROJECTS`: comma- or newline-separated project dirs whose chat sessions load the
 * account's whole Claude Code setup (global CLAUDE.md, hooks, skills, memory, MCP servers)
 * instead of the narrowed `CLAUDE_SETTING_SOURCES` / `CLAUDE_INLINE_MEMORY` isolation every
 * other project gets. Blank entries dropped, duplicates kept once, trailing slashes ignored.
 */
export function parseGlobalProjects(raw: string | undefined): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of (raw ?? '').split(/[,\n]/)) {
    const path = normalize(entry);
    if (!path || seen.has(path)) continue;
    seen.add(path);
    result.push(path);
  }
  return result;
}

/**
 * Which Claude settings layers a chat session loads. CLAUDE_SETTING_SOURCES="project,local" keeps a machine's
 * global CLAUDE.md, hooks and skills out of the chat while project-level files still apply. Default: all three.
 */
export function resolveSettingSources(raw: string | undefined): string[] {
  const allowed = ['user', 'project', 'local'];
  const picked = String(raw || '').split(',').map((part) => part.trim()).filter((part) => allowed.includes(part));
  return picked.length ? [...new Set(picked)] : ['project', 'user', 'local'];
}

export type SessionScope = {
  settingSources: string[];
  /** Hand the project's own CLAUDE.md to the system prompt (the CLI loads none without `project`). */
  inlineMemory: boolean;
  /** Environment for the spawned CLI: the narrowing variables are removed for a global project so it cannot re-apply them. */
  env: NodeJS.ProcessEnv;
};

export function isGlobalProject(cwd: string | undefined, globalProjects: readonly string[]): boolean {
  if (!cwd) return false;
  const wanted = normalize(cwd);
  return globalProjects.some((path) => normalize(path) === wanted);
}

export function sessionScope(environment: NodeJS.ProcessEnv, cwd: string | undefined): SessionScope {
  if (isGlobalProject(cwd, parseGlobalProjects(environment.GLOBAL_PROJECTS))) {
    const { CLAUDE_SETTING_SOURCES: _sources, CLAUDE_INLINE_MEMORY: _inline, ...env } = environment;
    return { settingSources: ['project', 'user', 'local'], inlineMemory: false, env };
  }
  const settingSources = resolveSettingSources(environment.CLAUDE_SETTING_SOURCES);
  return {
    settingSources,
    inlineMemory: environment.CLAUDE_INLINE_MEMORY === '1' && !settingSources.includes('project'),
    env: environment,
  };
}
