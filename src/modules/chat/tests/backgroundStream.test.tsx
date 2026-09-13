import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useChatRealtimeHandlers } from '@/modules/chat/hooks/useChatRealtimeHandlers';
import type { SessionStore } from '@/modules/chat/hooks/useSessionStore';
import type { ProjectSession, ServerEvent } from '@/shared/types';

/** A Claude turn streaming in a session the user is not looking at must land as one coalesced row, never one row per token. */
describe('background session streaming', () => {
  it('buffers per session and finalizes on stream_end without raw appends', () => {
    let listener: ((event: ServerEvent) => void) | null = null;
    const subscribe = (l: (event: ServerEvent) => void) => { listener = l; return () => {}; };
    const sessionStore = {
      appendRealtime: vi.fn(), updateStreaming: vi.fn(), finalizeStreaming: vi.fn(),
      fetchFromServer: vi.fn(), fetchMore: vi.fn(), truncateAt: vi.fn(), refreshLatestFromServer: vi.fn(),
      setActiveSession: vi.fn(), isStale: vi.fn(), getMessages: vi.fn(() => []), getSessionSlot: vi.fn(),
    } as unknown as SessionStore;
    const accumulatedStreamRef = { current: '' };
    renderHook(() => useChatRealtimeHandlers({
      isActive: true,
      subscribe,
      provider: 'claude',
      selectedSession: { id: 'active' } as ProjectSession,
      currentSessionId: 'active',
      setTokenBudget: vi.fn(),
      pendingPermissionRequests: [],
      setPendingPermissionRequests: vi.fn(),
      streamTimerRef: { current: null },
      accumulatedStreamRef,
      lastSeqRef: { current: new Map() },
      statusCheckSentAtRef: { current: new Map() },
      requestLatestMessages: vi.fn(async () => {}),
      sessionStore,
    }));
    const frame = (fields: Record<string, unknown>) => listener!({ provider: 'claude', sessionId: 'bg', ...fields } as unknown as ServerEvent);
    frame({ kind: 'stream_delta', content: 'Hel' });
    frame({ kind: 'stream_delta', content: 'lo' });
    frame({ kind: 'stream_end' });
    expect(sessionStore.updateStreaming).toHaveBeenLastCalledWith('bg', 'Hello', 'claude');
    expect(sessionStore.finalizeStreaming).toHaveBeenCalledWith('bg');
    expect(sessionStore.appendRealtime).not.toHaveBeenCalled();
    expect(accumulatedStreamRef.current).toBe('');
  });
});
