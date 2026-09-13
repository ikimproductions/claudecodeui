import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createStreamEventTracker } from '@/modules/providers/list/claude/claude-stream-events.js';

const SID = 'sess-1';
function ev(event: Record<string, unknown>, parent: string | null = null) {
  return { type: 'stream_event', event, parent_tool_use_id: parent, uuid: 'u', session_id: SID };
}
const thinkStart = () => ev({ type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '' } });
const think = (t: string) => ev({ type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: t } });
const textStart = (i = 1) => ev({ type: 'content_block_start', index: i, content_block: { type: 'text', text: '' } });
const text = (t: string, i = 1) => ev({ type: 'content_block_delta', index: i, delta: { type: 'text_delta', text: t } });
const stop = (i: number) => ev({ type: 'content_block_stop', index: i });
const toolStart = (name: string, i = 2) => ev({ type: 'content_block_start', index: i, content_block: { type: 'tool_use', id: 't1', name, input: {} } });

function kinds(msgs: Array<{ kind: string; content?: string; text?: string }>) {
  return msgs.map((m) => `${m.kind}:${m.kind === 'status' ? m.text : m.content ?? ''}`);
}

describe('claude stream events', () => {
  it('streams text deltas and ends on the text block stop only', () => {
    let now = 0;
    const tracker = createStreamEventTracker({ now: () => now });
    const out = [
      ...tracker.handle(ev({ type: 'message_start', message: {} }), SID),
      ...tracker.handle(textStart(), SID),
      ...tracker.handle(text('Hel'), SID),
      ...tracker.handle(text('lo'), SID),
      ...tracker.handle(stop(1), SID),
      ...tracker.handle(ev({ type: 'message_delta', delta: {} }), SID),
      ...tracker.handle(ev({ type: 'message_stop' }), SID),
    ];
    assert.deepEqual(kinds(out), ['status:Writing', 'stream_delta:Hel', 'stream_delta:lo', 'stream_end:']);
    assert.equal(out[1].sessionId, SID);
    assert.equal(out[1].provider, 'claude');
  });

  it('shows the last thinking line as status, throttled, never empty', () => {
    let now = 0;
    const tracker = createStreamEventTracker({ now: () => now, throttleMs: 150 });
    const out: ReturnType<typeof tracker.handle> = [];
    out.push(...tracker.handle(thinkStart(), SID));
    out.push(...tracker.handle(think('  \n'), SID)); // whitespace only → nothing
    out.push(...tracker.handle(think('First line'), SID)); // first status is immediate
    now = 50;
    out.push(...tracker.handle(think(' more\nSecond'), SID)); // within throttle → held
    now = 200;
    out.push(...tracker.handle(think(' line'), SID)); // flushes latest line
    assert.deepEqual(kinds(out), ['status:First line', 'status:Second line']);
    now = 400;
    // a delta that leaves the current line unchanged (trailing newline) repeats nothing
    assert.deepEqual(kinds(tracker.handle(think('\n'), SID)), []);
    // stopping the thinking block is not a text stream end
    assert.deepEqual(kinds(tracker.handle(stop(0), SID)), []);
  });

  it('truncates a long thinking line to one status line', () => {
    const tracker = createStreamEventTracker({ now: () => 0 });
    tracker.handle(thinkStart(), SID);
    const [msg] = tracker.handle(think('x'.repeat(300)), SID);
    assert.equal(msg.kind, 'status');
    assert.equal((msg.text as string).length, 120);
    assert.ok((msg.text as string).endsWith('…'));
  });

  it('names the tool when a tool_use block starts', () => {
    const tracker = createStreamEventTracker({ now: () => 0 });
    assert.deepEqual(kinds(tracker.handle(toolStart('Bash'), SID)), ['status:Bash']);
    assert.deepEqual(kinds(tracker.handle(stop(2), SID)), []);
  });

  it('ignores subagent stream events entirely', () => {
    const tracker = createStreamEventTracker({ now: () => 0 });
    const sub = (event: Record<string, unknown>) => ev(event, 'tool-9');
    assert.deepEqual(tracker.handle(sub({ type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } }), SID), []);
    assert.deepEqual(tracker.handle(sub({ type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'sub' } }), SID), []);
    assert.deepEqual(tracker.handle(sub({ type: 'content_block_start', index: 2, content_block: { type: 'tool_use', id: 'x', name: 'Read', input: {} } }), SID), []);
  });

  it('accumulated stream equals the final text so the client dedupes one bubble', () => {
    const tracker = createStreamEventTracker({ now: () => 0 });
    tracker.handle(textStart(), SID);
    const parts = ['Hello', ', ', 'world', '!'];
    const streamed = parts.flatMap((p) => tracker.handle(text(p), SID)).map((m) => m.content).join('');
    assert.equal(streamed, 'Hello, world!');
  });
});
