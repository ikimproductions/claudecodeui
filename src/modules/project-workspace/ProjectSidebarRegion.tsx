import { memo, useCallback } from 'react';
import type {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useProjectSidebarState } from '@/modules/project-workspace/context/ProjectsStateContext';
import { useSidebarWidth } from '@/modules/project-workspace/hooks/useSidebarWidth';
import { Sidebar } from '@/modules/sidebar';
import { useSetUiPreference, useUiPreferences } from '@/shared/context/UiPreferencesContext';
import type { ProjectWorkspaceShellProps } from '@/shared/types';

/** Rendered by ProjectWorkspaceShell to host the sidebar module, docked on desktop and as a drawer on mobile. */
function ProjectSidebarRegion({
  isMobile,
}: Pick<ProjectWorkspaceShellProps, 'isMobile'>) {
  const { t } = useTranslation('common');
  const { sidebarOpen, setSidebarOpen, sidebarSharedProps } = useProjectSidebarState();
  const { sidebarVisible } = useUiPreferences();
  const setPreference = useSetUiPreference();
  const collapse = useCallback(() => setPreference('sidebarVisible', false), [setPreference]);
  const { width, dragging, gripHandlers } = useSidebarWidth({ onCollapse: collapse });

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
            {...gripHandlers}
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
