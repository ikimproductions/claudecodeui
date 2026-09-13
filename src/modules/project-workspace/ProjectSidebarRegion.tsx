import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useProjectSidebarState } from '@/modules/project-workspace/context/ProjectsStateContext';
import { Sidebar } from '@/modules/sidebar';
import { useSetUiPreference, useUiPreferences } from '@/shared/context/UiPreferencesContext';
import type { ProjectWorkspaceShellProps } from '@/shared/types';

/**
 * The docked sidebar's width: 20 % under the old 288 px by default, draggable
 * by the grip on its border within ±20 % of that, and collapsed to the icon
 * rail when dragged well past the minimum. Remembered per browser.
 */
export const SIDEBAR_DEFAULT_WIDTH = 230;
export const SIDEBAR_MIN_WIDTH = 184;
export const SIDEBAR_MAX_WIDTH = 276;
const SIDEBAR_COLLAPSE_BELOW = 140;
const SIDEBAR_WIDTH_KEY = 'sidebar-w';

const clampWidth = (width: number): number => Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));

function readStoredWidth(): number {
  try {
    const stored = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(stored) && stored > 0 ? clampWidth(stored) : SIDEBAR_DEFAULT_WIDTH;
  } catch {
    return SIDEBAR_DEFAULT_WIDTH;
  }
}

/** Rendered by ProjectWorkspaceShell to host the sidebar module, docked on desktop and as a drawer on mobile. */
function ProjectSidebarRegion({
  isMobile,
}: Pick<ProjectWorkspaceShellProps, 'isMobile'>) {
  const { t } = useTranslation('common');
  const { sidebarOpen, setSidebarOpen, sidebarSharedProps } = useProjectSidebarState();
  const { sidebarVisible } = useUiPreferences();
  const setPreference = useSetUiPreference();
  const [width, setWidth] = useState<number>(readStoredWidth);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (dragging) {
      return;
    }
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
    } catch {
      // Private mode: the width lasts for the session only.
    }
  }, [dragging, width]);

  const handleGripPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startWidth: width };
    setDragging(true);
  }, [width]);

  const handleGripPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const nextWidth = drag.startWidth + (event.clientX - drag.startX);
    if (nextWidth < SIDEBAR_COLLAPSE_BELOW) {
      // Dragged well past the minimum: fold to the icon rail and forget the drag.
      dragRef.current = null;
      setDragging(false);
      setWidth(SIDEBAR_DEFAULT_WIDTH);
      setPreference('sidebarVisible', false);
      return;
    }
    setWidth(clampWidth(nextWidth));
  }, [setPreference]);

  const handleGripPointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  const handleBackdropClick = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  const handleBackdropTouch = useCallback((event: ReactTouchEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  if (!isMobile) {
    return (
      <div
        className={`group/side relative h-full flex-shrink-0 border-r border-border/50 ${dragging ? 'select-none' : ''}`}
        style={{ '--sidebar-w': `${width}px` } as React.CSSProperties}
        data-testid="sidebar-region"
      >
        <Sidebar {...sidebarSharedProps} />
        {sidebarVisible && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={t('sidebar.resize', { defaultValue: 'Resize sidebar' })}
            title={t('sidebar.resizeHint', { defaultValue: 'Drag to resize; drag left to collapse' })}
            onPointerDown={handleGripPointerDown}
            onPointerMove={handleGripPointerMove}
            onPointerUp={handleGripPointerUp}
            onPointerCancel={handleGripPointerUp}
            className="absolute inset-y-0 -right-1 z-20 w-2 cursor-col-resize touch-none"
            data-testid="sidebar-grip"
          >
            <span
              aria-hidden="true"
              className={`absolute left-1/2 top-1/2 h-9 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/30 transition-opacity duration-150 ${dragging ? 'opacity-100' : 'opacity-0 group-hover/side:opacity-100'}`}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex transition-all duration-150 ease-out ${
        sidebarOpen ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
    >
      <button
        className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-150 ease-out"
        onClick={handleBackdropClick}
        onTouchStart={handleBackdropTouch}
        aria-label={t('versionUpdate.ariaLabels.closeSidebar')}
      />
      <div
        className={`relative h-full w-[85vw] max-w-sm transform border-r border-border/40 bg-card transition-transform duration-150 ease-out sm:w-80 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <Sidebar {...sidebarSharedProps} />
      </div>
    </div>
  );
}

export default memo(ProjectSidebarRegion);
