import os from 'os';
import path from 'path';

// [ai] Claude Code keeps its state (projects/, settings.json, .credentials.json, skills/, .claude.json) under
// ~/.claude unless CLAUDE_CONFIG_DIR points elsewhere; the CLI we spawn honors that variable, so every
// place the server reads Claude's files must resolve through here or it looks at the wrong account.
export function claudeHome(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.CLAUDE_CONFIG_DIR?.trim();
  return configured ? path.resolve(configured) : path.join(os.homedir(), '.claude');
}

export function claudeProjectsRoot(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(claudeHome(env), 'projects');
}

/** ~/.claude.json lives beside ~/.claude by default, but inside CLAUDE_CONFIG_DIR when that is set. */
export function claudeJsonPath(env: NodeJS.ProcessEnv = process.env): string {
  return env.CLAUDE_CONFIG_DIR?.trim() ? path.join(claudeHome(env), '.claude.json') : path.join(os.homedir(), '.claude.json');
}
