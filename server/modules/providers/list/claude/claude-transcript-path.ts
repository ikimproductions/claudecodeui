import path from 'node:path';

import { claudeProjectsRoot } from '@/shared/claude-home.js';

/**
 * The folder Claude Code keeps a working directory's transcripts in: every
 * character outside [A-Za-z0-9] becomes a dash, so `/Users/me/.claude` lives
 * under `-Users-me--claude`.
 */
export function encodeClaudeProjectDir(cwd: string): string {
  return cwd.replace(/[^a-zA-Z0-9]/g, '-');
}

/** Where the CLI writes the transcript of `providerSessionId` run in `projectPath`. */
export function expectedClaudeTranscriptPath(
  projectPath: string,
  providerSessionId: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return path.join(claudeProjectsRoot(env), encodeClaudeProjectDir(projectPath), `${providerSessionId}.jsonl`);
}
