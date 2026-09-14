import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { LLMProvider, ProviderModelsDefinition } from '@/shared/types';
import { EMBED, buildReadyMessage, buildSessionsMessage, parseEmbedCommand } from '@/modules/chat/utils/embedBridge';

test('parseEmbedCommand accepts the five commands and rejects everything else', () => {
  assert.deepEqual(parseEmbedCommand({ type: 'astra:send', content: 'hi', options: { model: 'opus', effort: 'high' } }), { type: 'send', content: 'hi', options: { model: 'opus', effort: 'high' }, files: [] });
  assert.deepEqual(parseEmbedCommand({ type: 'astra:send', content: '  ' }), null, 'blank sends are dropped');
  assert.deepEqual(parseEmbedCommand({ type: 'astra:abort' }), { type: 'abort' });
  assert.deepEqual(parseEmbedCommand({ type: 'astra:new' }), { type: 'new' });
  assert.deepEqual(parseEmbedCommand({ type: 'astra:model', provider: 'claude', model: 'sonnet', effort: 'low' }), { type: 'model', options: { provider: 'claude', model: 'sonnet', effort: 'low' } });
  const blob = new Blob(['x'], { type: 'audio/webm' });
  assert.deepEqual(parseEmbedCommand({ type: 'astra:transcribe', blob, name: 'r.webm' }), { type: 'transcribe', blob, name: 'r.webm' });
  assert.equal(parseEmbedCommand({ type: 'astra:transcribe' }), null);
  assert.equal(parseEmbedCommand({ type: 'dossier:open' }), null);
  assert.equal(parseEmbedCommand('astra:send'), null);
  assert.equal(parseEmbedCommand(null), null);
});

test('rename + delete commands parse with their session id (and a trimmed title)', () => {
  assert.deepEqual(parseEmbedCommand({ type: 'astra:rename', sessionId: 's1', title: '  Plans  ' }), { type: 'rename', sessionId: 's1', title: 'Plans' });
  assert.equal(parseEmbedCommand({ type: 'astra:rename', sessionId: 's1', title: '  ' }), null);
  assert.deepEqual(parseEmbedCommand({ type: 'astra:delete', sessionId: 's1' }), { type: 'delete', sessionId: 's1' });
  assert.equal(parseEmbedCommand({ type: 'astra:delete' }), null);
});

test('buildReadyMessage lists providers with models, their default, and the current choice', () => {
  const catalog: Partial<Record<LLMProvider, ProviderModelsDefinition>> = {
    claude: { DEFAULT: 'fable', OPTIONS: [{ value: 'fable', label: 'Fable', effort: { default: 'medium', values: [{ value: 'low', description: 'Low' }, { value: 'high' }] } }, { value: 'opus', label: 'Opus' }] },
    codex: { DEFAULT: 'gpt', OPTIONS: [] },
    cursor: { DEFAULT: 'auto', OPTIONS: [{ value: 'auto', label: 'Auto' }] },
  };
  const ready = buildReadyMessage(catalog, 'claude', 'opus', 'high');
  assert.equal(ready.type, EMBED.ready);
  assert.deepEqual(ready.catalog.providers.map((p) => p.id), ['claude', 'cursor'], 'a provider without models is not offered');
  assert.deepEqual(ready.catalog.providers[0], { id: 'claude', label: 'Claude', default: 'fable', models: [{ value: 'fable', label: 'Fable', effort: { default: 'medium', values: [{ value: 'low', label: 'Low' }, { value: 'high', label: 'high' }] } }, { value: 'opus', label: 'Opus', effort: null }] });
  assert.deepEqual({ provider: ready.provider, model: ready.model, effort: ready.effort }, { provider: 'claude', model: 'opus', effort: 'high' });
});

test('sessions + open commands parse; buildSessionsMessage titles, sorts newest first and caps', () => {
  assert.deepEqual(parseEmbedCommand({ type: EMBED.sessions }), { type: 'sessions' });
  assert.deepEqual(parseEmbedCommand({ type: EMBED.open, sessionId: 'abc' }), { type: 'open', sessionId: 'abc' });
  assert.equal(parseEmbedCommand({ type: EMBED.open }), null);
  const m = buildSessionsMessage([
    { id: 'old', summary: 'First talk', lastActivity: '2026-09-01T10:00:00Z' },
    { id: 'blank', lastActivity: '2026-09-13T10:00:00Z' },
    { id: 'new', title: 'Named', updated_at: '2026-09-12T10:00:00Z' },
  ]);
  assert.equal(m.type, 'astra:sessions');
  assert.deepEqual(m.sessions.map((s) => [s.id, s.title]), [['blank', 'New conversation'], ['new', 'Named'], ['old', 'First talk']]);
  assert.equal(buildSessionsMessage(undefined).sessions.length, 0);
  assert.equal(buildSessionsMessage(Array.from({ length: 70 }, (_, i) => ({ id: String(i) }))).sessions.length, 60);
});
