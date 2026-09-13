import { describe, expect, it } from 'vitest';

import { dedupeAdjacentAssistantEchoes } from '@/modules/chat/hooks/useSessionStore';
import type { NormalizedMessage } from '@/shared/types';

const row = (fields: Partial<NormalizedMessage> & { kind: NormalizedMessage['kind'] }): NormalizedMessage => ({
  id: fields.id || `${fields.kind}_${Math.random()}`,
  sessionId: 's1',
  timestamp: '2026-09-13T00:00:00.000Z',
  provider: 'claude',
  ...fields,
});

describe('dedupeAdjacentAssistantEchoes', () => {
  it('collapses the finalized stream row with the final assistant text even when a thinking row lands between them', () => {
    const streamed = row({ id: 'text_stream', kind: 'text', role: 'assistant', content: 'Hello, world!' });
    const thinking = row({ kind: 'thinking', role: 'assistant', content: 'Greeting the user.' });
    const final = row({ id: 'uuid-final', kind: 'text', role: 'assistant', content: 'Hello, world!' });
    const out = dedupeAdjacentAssistantEchoes([streamed, thinking, final]);
    expect(out.map((m) => m.kind)).toEqual(['thinking', 'text']);
    expect(out[1].id).toBe('uuid-final');
  });

  it('keeps two different replies apart', () => {
    const a = row({ kind: 'text', role: 'assistant', content: 'One' });
    const t = row({ kind: 'thinking', role: 'assistant', content: 'hm' });
    const b = row({ kind: 'text', role: 'assistant', content: 'Two' });
    expect(dedupeAdjacentAssistantEchoes([a, t, b]).length).toBe(3);
  });

  it('still collapses a live stream_delta row into the final text', () => {
    const live = row({ id: '__streaming_s1', kind: 'stream_delta', content: 'Hi' });
    const final = row({ kind: 'text', role: 'assistant', content: 'Hi' });
    const out = dedupeAdjacentAssistantEchoes([live, final]);
    expect(out.length).toBe(1);
    expect(out[0].kind).toBe('text');
  });
});
