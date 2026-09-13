import assert from 'node:assert/strict';

import { test } from 'vitest';

import type { LLMProvider, ProviderModelsDefinition } from '@/shared/types';
import { EMBED, buildReadyMessage, parseEmbedCommand } from '@/modules/chat/utils/embedBridge';

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
