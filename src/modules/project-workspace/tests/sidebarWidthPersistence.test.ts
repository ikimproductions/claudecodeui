import assert from 'node:assert/strict';

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, test, vi } from 'vitest';

import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_WIDTH_KEY,
  SIDEBAR_WIDTH_WRITE_MS,
  useSidebarWidth,
} from '@/modules/project-workspace/hooks/useSidebarWidth';

/**
 * The width used to be written to localStorage only once the drag ended. A tab
 * switch or a pointercancel mid-drag lost it, so the sidebar came back at the
 * old width after a reload. Now the write is throttled during the drag and
 * flushed on release, and a collapse-by-drag stores the default.
 */

const pointer = (clientX: number, pointerId = 1) => ({
  button: 0,
  clientX,
  pointerId,
  preventDefault() {},
  currentTarget: { setPointerCapture() {} },
} as unknown as React.PointerEvent<HTMLDivElement>);

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('a drag without pointerup still leaves the last width in localStorage within the write window', () => {
  const { result } = renderHook(() => useSidebarWidth({ onCollapse: () => {} }));
  act(() => result.current.gripHandlers.onPointerDown(pointer(300)));
  act(() => result.current.gripHandlers.onPointerMove(pointer(330)));
  assert.equal(result.current.width, SIDEBAR_DEFAULT_WIDTH + 30);
  act(() => { vi.advanceTimersByTime(SIDEBAR_WIDTH_WRITE_MS + 5); });
  assert.equal(window.localStorage.getItem(SIDEBAR_WIDTH_KEY), String(SIDEBAR_DEFAULT_WIDTH + 30));
});

test('release writes immediately and the stored width is read back on mount', () => {
  const first = renderHook(() => useSidebarWidth({ onCollapse: () => {} }));
  act(() => first.result.current.gripHandlers.onPointerDown(pointer(300)));
  act(() => first.result.current.gripHandlers.onPointerMove(pointer(320)));
  act(() => first.result.current.gripHandlers.onPointerUp());
  assert.equal(window.localStorage.getItem(SIDEBAR_WIDTH_KEY), String(SIDEBAR_DEFAULT_WIDTH + 20));
  first.unmount();

  const second = renderHook(() => useSidebarWidth({ onCollapse: () => {} }));
  assert.equal(second.result.current.width, SIDEBAR_DEFAULT_WIDTH + 20);
});

test('dragging far left collapses, stores the default width and stops the drag', () => {
  let collapsed = 0;
  const { result } = renderHook(() => useSidebarWidth({ onCollapse: () => { collapsed += 1; } }));
  act(() => result.current.gripHandlers.onPointerDown(pointer(300)));
  act(() => result.current.gripHandlers.onPointerMove(pointer(100)));
  assert.equal(collapsed, 1);
  assert.equal(result.current.dragging, false);
  assert.equal(window.localStorage.getItem(SIDEBAR_WIDTH_KEY), String(SIDEBAR_DEFAULT_WIDTH));
  act(() => { vi.advanceTimersByTime(SIDEBAR_WIDTH_WRITE_MS + 5); });
  // The throttled write from the earlier move must not overwrite the default.
  assert.equal(window.localStorage.getItem(SIDEBAR_WIDTH_KEY), String(SIDEBAR_DEFAULT_WIDTH));
});
