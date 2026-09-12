import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type MemoryFs = { exists(filePath: string): boolean; read(filePath: string): string };
const realFs: MemoryFs = { exists: (p) => existsSync(p), read: (p) => readFileSync(p, 'utf8') };

export const MAX_MEMORY_FILE_BYTES = 64 * 1024;

/**
 * CLAUDE.md files from the repository root down to `cwd`, formatted for a system-prompt append.
 * Used when CLAUDE_INLINE_MEMORY=1 and settingSources exclude `project`: the CLI then loads no
 * memory at all (not even the account's global CLAUDE.md, which is the point), so the project's
 * own instructions are handed over here. Root-first, so the innermost file (the persona) wins.
 * The walk stops at the directory holding `.git`; without one (or past `maxDepth` parents) only
 * cwd is used, and the home directory is never entered, so a global ~/CLAUDE.md cannot leak back
 * in. Each file is capped at MAX_MEMORY_FILE_BYTES.
 */
export function inlineMemoryPrompt(cwd: string, fs: MemoryFs = realFs, maxDepth = 8, home = os.homedir()): string {
  const start = path.resolve(cwd);
  const stop = path.resolve(home);
  let chain: string[] = [];
  let dir = start;
  let rooted = false;
  for (let depth = 0; depth <= maxDepth; depth += 1) {
    if (dir === stop) break;
    chain.push(dir);
    if (fs.exists(path.join(dir, '.git'))) { rooted = true; break; }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  if (!rooted) chain = [start];
  const root = chain[chain.length - 1];
  const sections = chain
    .reverse()
    .map((d) => path.join(d, 'CLAUDE.md'))
    .filter((f) => fs.exists(f))
    .map((f) => {
      const text = fs.read(f);
      const body = text.length > MAX_MEMORY_FILE_BYTES ? `${text.slice(0, MAX_MEMORY_FILE_BYTES)}\n\n[truncated: ${text.length} bytes]` : text;
      return `# ${path.relative(root, f) || 'CLAUDE.md'}\n\n${body.trim()}`;
    });
  return sections.length
    ? `Project instructions (CLAUDE.md files, outermost first; the last one is the working directory's and takes precedence):\n\n${sections.join('\n\n---\n\n')}`
    : '';
}
