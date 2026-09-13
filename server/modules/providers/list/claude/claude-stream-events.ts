import { createNormalizedMessage } from '@/shared/utils.js';
import type { NormalizedMessage } from '@/shared/types.js';

const PROVIDER = 'claude';
const STATUS_MAX_CHARS = 120;
const DEFAULT_THROTTLE_MS = 150;
const WRITING_STATUS = 'Writing';

type StreamEventTrackerOptions = {
  now?: () => number;
  throttleMs?: number;
};

type PartialMessage = {
  type?: string;
  event?: Record<string, any>;
  parent_tool_use_id?: string | null;
  parentToolUseId?: string | null;
};

/**
 * Turns the SDK's `stream_event` messages (emitted with `includePartialMessages`)
 * into client frames: text deltas become `stream_delta` / `stream_end`, the
 * thinking that precedes them becomes a live `status` line (its last line, so
 * the activity indicator shows what the model is actually reasoning about
 * instead of a rotating placeholder), and a starting tool names itself.
 * Subagent events (parent_tool_use_id) are dropped: their text belongs to the
 * Agent card, not the main thread.
 */
export function createStreamEventTracker({ now = Date.now, throttleMs = DEFAULT_THROTTLE_MS }: StreamEventTrackerOptions = {}) {
  const blockTypes = new Map<number, string>();
  let thinking = '';
  let lastStatus: string | null = null;
  let lastStatusAt = -Infinity;
  let pendingStatus: string | null = null;

  const status = (text: string, sessionId: string | null): NormalizedMessage[] => {
    if (!text || text === lastStatus) return [];
    lastStatus = text;
    lastStatusAt = now();
    pendingStatus = null;
    return [createNormalizedMessage({ kind: 'status', text, sessionId, provider: PROVIDER })];
  };

  const thinkingLine = (): string => {
    const lines = thinking.split('\n').map((line) => line.trim()).filter(Boolean);
    const line = lines[lines.length - 1] || '';
    return line.length > STATUS_MAX_CHARS ? `${line.slice(0, STATUS_MAX_CHARS - 1)}…` : line;
  };

  const handle = (message: PartialMessage, sessionId: string | null): NormalizedMessage[] => {
    if (message?.type !== 'stream_event' || !message.event) return [];
    if (message.parent_tool_use_id || message.parentToolUseId) return [];
    const event = message.event;

    switch (event.type) {
      case 'content_block_start': {
        const block = event.content_block || {};
        blockTypes.set(event.index, block.type);
        if (block.type === 'text') return status(WRITING_STATUS, sessionId);
        if (block.type === 'thinking') { thinking = ''; return []; }
        if (block.type === 'tool_use' && typeof block.name === 'string') return status(block.name, sessionId);
        return [];
      }
      case 'content_block_delta': {
        const delta = event.delta || {};
        if (delta.type === 'text_delta' && delta.text) {
          return [createNormalizedMessage({ kind: 'stream_delta', content: delta.text, sessionId, provider: PROVIDER })];
        }
        if (delta.type === 'thinking_delta' && typeof delta.thinking === 'string') {
          thinking += delta.thinking;
          const line = thinkingLine();
          if (!line || line === lastStatus) return [];
          // First line goes out at once; later lines are throttled so a fast
          // thinker does not flood the socket, the newest line always wins.
          if (lastStatus === null || now() - lastStatusAt >= throttleMs) return status(line, sessionId);
          pendingStatus = line;
          return [];
        }
        return [];
      }
      case 'content_block_stop': {
        const type = blockTypes.get(event.index);
        blockTypes.delete(event.index);
        if (type === 'text') return [createNormalizedMessage({ kind: 'stream_end', sessionId, provider: PROVIDER })];
        if (type === 'thinking' && pendingStatus) return status(pendingStatus, sessionId);
        return [];
      }
      default:
        return [];
    }
  };

  return { handle };
}
