import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

/**
 * The docked sidebar's width: 20 % under the old 288 px by default, draggable
 * by the grip on its border within ±20 % of that, and collapsed to the icon
 * rail when dragged well past the minimum. Remembered per browser: written
 * once, on release (or on collapse), never mid-drag.
 */
export const SIDEBAR_DEFAULT_WIDTH = 230;
export const SIDEBAR_MIN_WIDTH = 184;
export const SIDEBAR_MAX_WIDTH = 276;
export const SIDEBAR_COLLAPSE_BELOW = 140;
export const SIDEBAR_WIDTH_KEY = 'sidebar-w';

const clampWidth = (width: number): number => Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));

function readStoredWidth(): number {
  try {
    const stored = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(stored) && stored > 0 ? clampWidth(stored) : SIDEBAR_DEFAULT_WIDTH;
  } catch {
    return SIDEBAR_DEFAULT_WIDTH;
  }
}

function writeStoredWidth(width: number) {
  try {
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
  } catch {
    // Private mode: the width lasts for the session only.
  }
}

type GripHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
};

/** Used by ProjectSidebarRegion for the grip on the docked sidebar's border. */
export function useSidebarWidth({ onCollapse }: { onCollapse: () => void }): {
  width: number;
  dragging: boolean;
  gripHandlers: GripHandlers;
} {
  const [width, setWidth] = useState<number>(readStoredWidth);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startWidth: width };
    setDragging(true);
  }, [width]);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const nextWidth = drag.startWidth + (event.clientX - drag.startX);
    if (nextWidth < SIDEBAR_COLLAPSE_BELOW) {
      // Dragged well past the minimum: fold to the icon rail and forget the drag.
      dragRef.current = null;
      setDragging(false);
      setWidth(SIDEBAR_DEFAULT_WIDTH);
      writeStoredWidth(SIDEBAR_DEFAULT_WIDTH);
      onCollapse();
      return;
    }
    setWidth(clampWidth(nextWidth));
  }, [onCollapse]);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    setWidth((current) => {
      writeStoredWidth(current);
      return current;
    });
  }, []);

  return {
    width,
    dragging,
    gripHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
