import assert from 'node:assert/strict';

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, test, vi } from 'vitest';

import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_WIDTH_KEY,
  useSidebarWidth,
} from '@/modules/project-workspace/hooks/useSidebarWidth';

/**
 * The width is written to localStorage once, on release (Isaac 2026-09-13:
 * never mid-drag); a collapse-by-drag stores the default.
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

test('nothing is written while the drag is in progress', () => {
  const { result } = renderHook(() => useSidebarWidth({ onCollapse: () => {} }));
  act(() => result.current.gripHandlers.onPointerDown(pointer(300)));
  act(() => result.current.gripHandlers.onPointerMove(pointer(330)));
  assert.equal(result.current.width, SIDEBAR_DEFAULT_WIDTH + 30);
  act(() => { vi.advanceTimersByTime(1000); });
  assert.equal(window.localStorage.getItem(SIDEBAR_WIDTH_KEY), null);
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
});
