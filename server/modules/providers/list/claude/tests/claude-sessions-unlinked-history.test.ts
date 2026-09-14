import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { closeConnection, initializeDatabase, sessionsDb } from '@/modules/database/index.js';
import { ClaudeSessionsProvider } from '@/modules/providers/list/claude/claude-sessions.provider.js';

/**
 * A session the app created gets its `provider_session_id` the moment the
 * run starts, but `jsonl_path` only when the polling watcher indexes the
 * file — seconds to minutes later on a big account. A refresh in that window
 * must still show the thread, so history derives the path itself.
 */
test('history of a session the watcher has not linked yet is read from the derived transcript path', async () => {
  const previous = { DATABASE_PATH: process.env.DATABASE_PATH, CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR };
  const temp = await mkdtemp(path.join(tmpdir(), 'unlinked-history-'));
  closeConnection();
  process.env.DATABASE_PATH = path.join(temp, 'auth.db');
  process.env.CLAUDE_CONFIG_DIR = path.join(temp, 'claude');
  await initializeDatabase();
  try {
    const cwd = path.join(temp, 'proj');
    const dir = path.join(temp, 'claude', 'projects', cwd.replace(/[^a-zA-Z0-9]/g, '-'));
    await mkdir(dir, { recursive: true });
    const rows = [
      { type: 'user', uuid: 'u1', sessionId: 'prov-1', cwd, timestamp: '2026-09-14T10:00:00.000Z', message: { role: 'user', content: 'ping' } },
      { type: 'assistant', uuid: 'a1', parentUuid: 'u1', sessionId: 'prov-1', cwd, timestamp: '2026-09-14T10:00:01.000Z', message: { role: 'assistant', content: [{ type: 'text', text: 'PONG' }] } },
    ];
    await writeFile(path.join(dir, 'prov-1.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');

    sessionsDb.createAppSession('app-1', 'claude', cwd, 'ping');
    sessionsDb.assignProviderSessionId('app-1', 'prov-1');
    assert.equal(sessionsDb.getSessionById('app-1')?.jsonl_path, null);

    const history = await new ClaudeSessionsProvider().fetchHistory('app-1', { providerSessionId: 'prov-1', projectPath: cwd });
    assert.ok(history.messages.length >= 2, `expected the thread, got ${JSON.stringify(history)}`);
    assert.ok(JSON.stringify(history.messages).includes('PONG'));
    // Found once, the row is linked so the next read hits the transcript cache.
    assert.equal(sessionsDb.getSessionById('app-1')?.jsonl_path, path.join(dir, 'prov-1.jsonl'));
  } finally {
    closeConnection();
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
    await rm(temp, { recursive: true, force: true });
  }
});
