import { Activity, Archive, Folder, MessageSquare, Plus, RefreshCw, Search, X, PanelLeftClose, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TFunction } from 'i18next';

import { Button, Input, Tooltip } from '@/shared/ui';
import { CLOUDCLI_WORDMARK_FONT_FAMILY } from '@/shared/constants';
import { useUiPreferences } from '@/shared/context/UiPreferencesContext';
import { IS_PLATFORM, cn } from '@/shared/utils';
import type { SidebarSearchMode } from '@/shared/types';
import GitHubStarBadge from '@/modules/sidebar/GitHubStarBadge';
import SidebarViewSwitcher from '@/modules/sidebar/SidebarViewSwitcher';

const MOD_KEY =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

type SidebarHeaderProps = {
  isPWA: boolean;
  isMobile: boolean;
  isLoading: boolean;
  projectsCount: number;
  runningSessionsCount: number;
  archivedSessionsCount: number;
  isArchivedSessionsLoading: boolean;
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  onClearSearchFilter: () => void;
  searchMode: SidebarSearchMode;
  onSearchModeChange: (mode: SidebarSearchMode) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onCreateProject: () => void;
  onCollapseSidebar: () => void;
  t: TFunction;
};

type ModeDefinition = { id: SidebarSearchMode; icon: LucideIcon; label: string };

/** Module-level, not a nested render function, so the wordmark is not remounted on every SidebarHeader render. */
function LogoBlock({ t }: { t: TFunction }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/90 shadow-sm">
        <svg className="h-3.5 w-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h1 className="truncate text-sm font-bold tracking-tight text-foreground" style={{ fontFamily: CLOUDCLI_WORDMARK_FONT_FAMILY }}>
        {t('app.title')}
      </h1>
    </div>
  );
}

const iconButtonClass = 'h-7 w-7 rounded-lg p-0 text-muted-foreground hover:bg-accent/80 hover:text-foreground';

/**
 * Rendered by SidebarContent at the top of the panel: two quiet rows. Row one
 * is the icon-only list-mode control with search, refresh, new project and
 * collapse at the right; the search field appears under it only while open;
 * row two is the workspace view switcher (four equal cells) when it lives here.
 */
export default function SidebarHeader({
  isPWA,
  isMobile,
  runningSessionsCount,
  searchFilter,
  onSearchFilterChange,
  onClearSearchFilter,
  searchMode,
  onSearchModeChange,
  onRefresh,
  isRefreshing,
  onCreateProject,
  onCollapseSidebar,
  t,
}: SidebarHeaderProps) {
  const { showBrandHeader, showProjectsTab, showNewProjectButton, workspaceTabsInSidebar } = useUiPreferences();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchVisible = searchOpen || searchFilter.length > 0;

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // The projects list can be hidden by a layout flag; never leave the sidebar on a mode it cannot show.
  useEffect(() => {
    if (!showProjectsTab && searchMode === 'projects') onSearchModeChange('conversations');
  }, [showProjectsTab, searchMode, onSearchModeChange]);

  const modes: ModeDefinition[] = [
    ...(showProjectsTab ? [{ id: 'projects' as const, icon: Folder, label: t('search.modeProjects') }] : []),
    { id: 'conversations', icon: MessageSquare, label: t('search.modeConversations') },
    { id: 'running', icon: Activity, label: t('search.modeRunning', 'Running') },
    { id: 'archived', icon: Archive, label: t('search.modeArchived', 'Archive') },
  ];

  const searchPlaceholder = searchMode === 'conversations'
    ? t('search.conversationsPlaceholder')
    : searchMode === 'archived'
      ? t('search.archivedPlaceholder', 'Search archived sessions...')
      : searchMode === 'running'
        ? t('search.runningPlaceholder', 'Search running sessions...')
        : t('projects.searchPlaceholder');
  const runningBadgeText = runningSessionsCount > 99 ? '99+' : String(runningSessionsCount);
  const closeSearch = () => {
    onClearSearchFilter();
    setSearchOpen(false);
  };

  return (
    <div className="flex-shrink-0" style={isPWA && isMobile ? { paddingTop: '16px' } : undefined}>
      {showBrandHeader && (
        <div className="flex items-center justify-between gap-2 px-3 pt-3">
          {IS_PLATFORM ? (
            <a href="https://cloudcli.ai/dashboard" className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80" title={t('tooltips.viewEnvironments')}>
              <LogoBlock t={t} />
            </a>
          ) : (
            <LogoBlock t={t} />
          )}
          <GitHubStarBadge />
        </div>
      )}

      <div className="flex items-center gap-1 px-2 pb-1 pt-2" data-testid="sidebar-toolbar">
        <div className="flex flex-shrink-0 rounded-lg bg-muted/50 p-0.5" role="tablist" aria-label={t('search.listModes', 'Sidebar lists')} data-testid="sidebar-mode-tabs">
          {modes.map((mode) => {
            const isActive = searchMode === mode.id;
            return (
              <Tooltip key={mode.id} content={mode.label} position="bottom">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={mode.label}
                  data-mode={mode.id}
                  onClick={() => onSearchModeChange(mode.id)}
                  className={cn(
                    'relative flex h-7 w-8 items-center justify-center rounded-md transition-all',
                    isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <mode.icon className={cn('h-[15px] w-[15px] shrink-0', mode.id === 'running' && runningSessionsCount > 0 && 'text-emerald-500')} strokeWidth={isActive ? 2.1 : 1.7} />
                  {mode.id === 'running' && runningSessionsCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-emerald-500 px-0.5 text-[8px] font-semibold leading-none text-white shadow-sm ring-1 ring-background">
                      {runningBadgeText}
                    </span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </div>

        <div className="ml-auto flex flex-shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(iconButtonClass, searchVisible && 'bg-accent/80 text-foreground')}
            onClick={() => (searchVisible ? closeSearch() : setSearchOpen(true))}
            aria-pressed={searchVisible}
            aria-label={t('search.open', 'Search')}
            title={t('search.open', 'Search')}
            data-testid="sidebar-search-toggle"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className={iconButtonClass} onClick={onRefresh} disabled={isRefreshing} title={t('tooltips.refresh')} aria-label={t('tooltips.refresh')}>
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
          </Button>
          {showNewProjectButton && (
            <Button variant="ghost" size="sm" className={iconButtonClass} onClick={onCreateProject} title={t('tooltips.createProject')} aria-label={t('tooltips.createProject')}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          {!isMobile && (
            <Button variant="ghost" size="sm" className={iconButtonClass} onClick={onCollapseSidebar} title={t('tooltips.hideSidebar')} aria-label={t('tooltips.hideSidebar')} data-testid="sidebar-collapse">
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {searchVisible && (
        <div className="relative px-2 pb-2">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-[calc(50%+4px)] text-muted-foreground/50" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchFilter}
            onChange={(event) => onSearchFilterChange(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Escape') closeSearch(); }}
            className="nav-search-input h-8 rounded-lg border-0 pl-8 pr-14 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {searchFilter ? (
            <button onClick={closeSearch} aria-label={t('tooltips.clearSearch')} className="absolute right-4 top-1/2 -translate-y-[calc(50%+4px)] rounded-md p-0.5 hover:bg-accent">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          ) : (
            <kbd aria-hidden title={t('tooltips.openCommandPalette')} className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-[calc(50%+4px)] items-center gap-0.5 rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-flex">
              {MOD_KEY}<span>K</span>
            </kbd>
          )}
        </div>
      )}

      {workspaceTabsInSidebar && (
        <div className="px-2 pb-1.5 pt-0.5">
          <SidebarViewSwitcher isMobile={isMobile} />
        </div>
      )}

      <div className="nav-divider" />
    </div>
  );
}
