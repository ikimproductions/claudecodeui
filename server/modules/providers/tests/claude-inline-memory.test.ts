import assert from 'node:assert/strict';
import test from 'node:test';

import { MAX_MEMORY_FILE_BYTES, inlineMemoryPrompt } from '@/modules/providers/list/claude/claude-inline-memory.js';

const tree = (files: Record<string, string>) => ({ exists: (p: string) => p in files, read: (p: string) => files[p] });

test('collects CLAUDE.md from the git root down to cwd, root first', () => {
  const fs = tree({ '/repo/.git': '', '/repo/CLAUDE.md': 'repo rules', '/repo/personas/coach/CLAUDE.md': 'be the coach' });
  const out = inlineMemoryPrompt('/repo/personas/coach', fs, 8, '/home');
  assert.match(out, /# CLAUDE.md\n\nrepo rules/);
  assert.match(out, /# personas\/coach\/CLAUDE.md\n\nbe the coach/);
  assert.ok(out.indexOf('repo rules') < out.indexOf('be the coach'), 'innermost last');
});

test('does not climb past the git root, and returns "" with nothing to load', () => {
  const fs = tree({ '/home/CLAUDE.md': 'GLOBAL', '/home/repo/.git': '', '/home/repo/app/CLAUDE.md': 'app' });
  const out = inlineMemoryPrompt('/home/repo/app', fs, 8, '/elsewhere');
  assert.ok(!out.includes('GLOBAL') && out.includes('app'));
  assert.equal(inlineMemoryPrompt('/nowhere/deep', tree({}), 8, '/home'), '');
});

test('without a git root only cwd is used, and the home directory is never entered', () => {
  const fs = tree({ '/Users/me/CLAUDE.md': 'HOME-LEVEL', '/Users/me/Desktop/CLAUDE.md': 'DESKTOP', '/Users/me/Desktop/x/CLAUDE.md': 'X' });
  const out = inlineMemoryPrompt('/Users/me/Desktop/x', fs, 8, '/Users/me');
  assert.ok(out.includes('X') && !out.includes('DESKTOP') && !out.includes('HOME-LEVEL'), out);
  const rooted = tree({ '/Users/me/CLAUDE.md': 'HOME-LEVEL', '/Users/me/r/.git': '', '/Users/me/r/CLAUDE.md': 'R' });
  assert.ok(!inlineMemoryPrompt('/Users/me/r', rooted, 8, '/Users/me').includes('HOME-LEVEL'));
});

test('oversized files are truncated with a marker', () => {
  const fs = tree({ '/r/.git': '', '/r/CLAUDE.md': 'a'.repeat(MAX_MEMORY_FILE_BYTES + 10) });
  const out = inlineMemoryPrompt('/r', fs, 8, '/home');
  assert.ok(out.includes('[truncated:') && out.length < MAX_MEMORY_FILE_BYTES + 300);
});
