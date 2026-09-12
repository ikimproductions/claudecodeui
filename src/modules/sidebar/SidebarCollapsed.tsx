import { Settings, Sparkles, PanelLeftOpen, Bug, AlertTriangle } from 'lucide-react';
import type { TFunction } from 'i18next';

import { useUiPreferences } from '@/shared/context/UiPreferencesContext';
import DiscordIcon from '@/modules/sidebar/DiscordIcon';
import { DISCORD_INVITE_URL, GITHUB_ISSUES_URL } from '@/modules/sidebar/SidebarFooter';
import SidebarViewSwitcher from '@/modules/sidebar/SidebarViewSwitcher';

type SidebarCollapsedProps = {
  onExpand: () => void;
  onShowSettings: () => void;
  updateAvailable: boolean;
  restartRequired: boolean;
  onShowVersionModal: () => void;
  t: TFunction;
};

const railButton = 'group flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-accent/80';
const railIcon = 'h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground';

/** Rendered by Sidebar instead of SidebarContent when the panel is collapsed to its icon rail. */
export default function SidebarCollapsed({
  onExpand,
  onShowSettings,
  updateAvailable,
  restartRequired,
  onShowVersionModal,
  t,
}: SidebarCollapsedProps) {
  const { showCommunityLinks, workspaceTabsInSidebar } = useUiPreferences();

  return (
    <div className="flex h-full w-12 flex-col items-center gap-1 bg-background/80 py-3 backdrop-blur-sm">
      <button onClick={onExpand} className={railButton} aria-label={t('common:versionUpdate.ariaLabels.showSidebar')} title={t('common:versionUpdate.ariaLabels.showSidebar')}>
        <PanelLeftOpen className={railIcon} />
      </button>

      <div className="nav-divider my-1 w-6" />

      {workspaceTabsInSidebar && (
        <>
          <SidebarViewSwitcher isMobile={false} rail />
          <div className="nav-divider my-1 w-6" />
        </>
      )}

      <button onClick={onShowSettings} className={railButton} aria-label={t('actions.settings')} title={t('actions.settings')}>
        <Settings className={railIcon} />
      </button>

      {showCommunityLinks && (
        <>
          <a href={GITHUB_ISSUES_URL} target="_blank" rel="noopener noreferrer" className={railButton} aria-label={t('actions.reportIssue')} title={t('actions.reportIssue')}>
            <Bug className={railIcon} />
          </a>
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className={railButton} aria-label={t('actions.joinCommunity')} title={t('actions.joinCommunity')}>
            <DiscordIcon className={railIcon} />
          </a>
        </>
      )}

      {restartRequired && (
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg" aria-label={t('version.restartRequired')} title={t('version.restartRequired')}>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        </div>
      )}

      {updateAvailable && (
        <button onClick={onShowVersionModal} className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-accent/80" aria-label={t('common:versionUpdate.ariaLabels.updateAvailable')} title={t('common:versionUpdate.ariaLabels.updateAvailable')}>
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
        </button>
      )}
    </div>
  );
}
