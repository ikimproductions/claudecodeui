import assert from 'node:assert/strict';

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, test, vi } from 'vitest';

import { useEmbedBridge } from '@/modules/chat/hooks/useEmbedBridge';
import type { LLMProvider, ProviderModelsDefinition } from '@/shared/types';

vi.mock('@/shared/api', () => ({
  transcribeVoice: vi.fn(async () => ({ ok: true, json: async () => ({ text: ' hello there ' }) })),
}));

const catalog: Partial<Record<LLMProvider, ProviderModelsDefinition>> = {
  claude: { DEFAULT: 'fable', OPTIONS: [{ value: 'fable', label: 'Fable' }, { value: 'opus', label: 'Opus' }] },
};

type Args = Parameters<typeof useEmbedBridge>[0];

let posted: unknown[];
let args: Args;
const ORIGIN = 'http://atlas.test';
const message = (data: unknown, origin = ORIGIN) => act(() => { window.dispatchEvent(new MessageEvent('message', { data, source: window, origin })); });

beforeEach(() => {
  posted = [];
  vi.spyOn(window.parent, 'postMessage').mockImplementation((data: unknown) => { posted.push(data); });
  args = {
    enabled: true,
    parentOrigin: ORIGIN,
    provider: 'claude',
    setProvider: vi.fn(),
    providerModelCatalog: catalog,
    providerModelsLoading: false,
    currentProviderModel: 'fable',
    currentProviderEffort: 'medium',
    selectProviderModel: vi.fn(async () => {}),
    selectProviderEffort: vi.fn(async () => {}),
    currentSessionId: null,
    isProcessing: false,
    handleVoiceTranscript: vi.fn(),
    handleAbortSession: vi.fn(),
    setAttachedFiles: vi.fn(),
    onNewSession: vi.fn(),
    sessions: [{ id: 's1', summary: 'Hello' }],
    openSession: vi.fn(),
  };
});
afterEach(() => { vi.restoreAllMocks(); });

const types = () => posted.map((m) => (m as { type: string }).type);

test('posts ready once the catalogue is in, then session and state changes', () => {
  const { rerender } = renderHook((props: Args) => useEmbedBridge(props), { initialProps: { ...args, providerModelsLoading: true } });
  assert.ok(!types().includes('astra:ready'), 'no ready while the catalogue loads');
  rerender({ ...args });
  const ready = posted.find((m) => (m as { type: string }).type === 'astra:ready') as { catalog: { providers: { id: string }[] }; model: string };
  assert.equal(ready.catalog.providers[0].id, 'claude'); assert.equal(ready.model, 'fable');
  rerender({ ...args, currentSessionId: 'sess-1', isProcessing: true });
  assert.deepEqual(posted.filter((m) => (m as { type: string }).type === 'astra:session').pop(), { type: 'astra:session', sessionId: 'sess-1' });
  assert.deepEqual(posted.filter((m) => (m as { type: string }).type === 'astra:state').pop(), { type: 'astra:state', streaming: true });
});

test('disabled: nothing is posted and messages are ignored', () => {
  renderHook(() => useEmbedBridge({ ...args, enabled: false }));
  message({ type: 'astra:abort' });
  assert.equal(posted.length, 0); assert.equal((args.handleAbortSession as ReturnType<typeof vi.fn>).mock.calls.length, 0);
});

test('send with the current model submits at once through the voice-transcript path', () => {
  renderHook(() => useEmbedBridge(args));
  message({ type: 'astra:send', content: 'hi', options: { model: 'fable' } });
  assert.deepEqual((args.handleVoiceTranscript as ReturnType<typeof vi.fn>).mock.calls, [['hi', true]]);
  assert.equal((args.selectProviderModel as ReturnType<typeof vi.fn>).mock.calls.length, 0);
});

test('send with another model waits for the provider state to catch up, then submits with attachments', async () => {
  const { rerender } = renderHook((props: Args) => useEmbedBridge(props), { initialProps: args });
  const file = new File(['x'], 'a.png', { type: 'image/png' });
  message({ type: 'astra:send', content: 'draw', options: { model: 'opus', effort: 'high' }, files: [file] });
  await waitFor(() => assert.equal((args.selectProviderModel as ReturnType<typeof vi.fn>).mock.calls.length, 1));
  assert.deepEqual((args.selectProviderModel as ReturnType<typeof vi.fn>).mock.calls[0], ['claude', 'opus', null]);
  assert.deepEqual((args.selectProviderEffort as ReturnType<typeof vi.fn>).mock.calls[0], ['claude', 'high', null]);
  assert.equal((args.handleVoiceTranscript as ReturnType<typeof vi.fn>).mock.calls.length, 0, 'not sent until the model matches');
  rerender({ ...args, currentProviderModel: 'opus', currentProviderEffort: 'high' });
  assert.deepEqual((args.setAttachedFiles as ReturnType<typeof vi.fn>).mock.calls, [[[file]]]);
  assert.deepEqual((args.handleVoiceTranscript as ReturnType<typeof vi.fn>).mock.calls, [['draw', true]]);
  rerender({ ...args, currentProviderModel: 'opus', currentProviderEffort: 'high', isProcessing: true });
  assert.equal((args.handleVoiceTranscript as ReturnType<typeof vi.fn>).mock.calls.length, 1, 'sent exactly once');
});

test('abort, new and a provider switch map to the workspace actions', () => {
  renderHook(() => useEmbedBridge(args));
  message({ type: 'astra:abort' }); message({ type: 'astra:new' }); message({ type: 'astra:model', provider: 'codex' });
  assert.equal((args.handleAbortSession as ReturnType<typeof vi.fn>).mock.calls.length, 1);
  assert.equal((args.onNewSession as ReturnType<typeof vi.fn>).mock.calls.length, 1);
  assert.deepEqual((args.setProvider as ReturnType<typeof vi.fn>).mock.calls, [['codex']]);
});

test('transcribe answers with the trimmed text', async () => {
  renderHook(() => useEmbedBridge(args));
  message({ type: 'astra:transcribe', blob: new Blob(['x'], { type: 'audio/webm' }), name: 'r.webm' });
  await waitFor(() => assert.ok(types().includes('astra:transcript')));
  assert.deepEqual(posted.pop(), { type: 'astra:transcript', text: 'hello there' });
});

test('commands from another origin are ignored and nothing is posted without a parent origin', async () => {
  const first = renderHook(() => useEmbedBridge(args));
  await waitFor(() => assert.ok(posted.some((m) => (m as { type: string }).type === 'astra:ready')));
  message({ type: 'astra:send', content: 'evil' }, 'http://evil.test');
  first.unmount();
  assert.equal((args.handleVoiceTranscript as ReturnType<typeof vi.fn>).mock.calls.length, 0);
  posted = [];
  renderHook(() => useEmbedBridge({ ...args, parentOrigin: '' }));
  message({ type: 'astra:send', content: 'still evil' });
  assert.deepEqual(posted, []);
  assert.equal((args.handleVoiceTranscript as ReturnType<typeof vi.fn>).mock.calls.length, 0);
});

test('a second send before the first settles flushes the first instead of dropping it', async () => {
  args.selectProviderModel = vi.fn(() => new Promise(() => {}));   // never settles
  renderHook(() => useEmbedBridge(args));
  message({ type: 'astra:send', content: 'one', options: { model: 'opus' } });
  message({ type: 'astra:send', content: 'two', options: { model: 'opus' } });
  const calls = (args.handleVoiceTranscript as ReturnType<typeof vi.fn>).mock.calls;
  assert.deepEqual(calls.map((c) => c[0]), ['one']);
});

test('the history list is posted with the sessions, again on request, and open navigates', async () => {
  renderHook(() => useEmbedBridge(args));
  await waitFor(() => assert.ok(posted.some((m) => (m as { type: string }).type === 'astra:sessions')));
  const first = posted.filter((m) => (m as { type: string }).type === 'astra:sessions');
  assert.deepEqual((first[0] as { sessions: { id: string; title: string }[] }).sessions.map((s) => s.title), ['Hello']);
  message({ type: 'astra:sessions' });
  assert.equal(posted.filter((m) => (m as { type: string }).type === 'astra:sessions').length, first.length + 1);
  message({ type: 'astra:open', sessionId: 's1' });
  assert.deepEqual((args.openSession as ReturnType<typeof vi.fn>).mock.calls, [['s1']]);
});
