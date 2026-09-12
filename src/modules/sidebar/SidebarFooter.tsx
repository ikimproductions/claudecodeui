import { Settings, ArrowUpCircle, Bug, AlertTriangle } from 'lucide-react';
import type { TFunction } from 'i18next';

import { IS_PLATFORM } from '@/shared/utils';
import type { ReleaseInfo } from '@/shared/types';
import { useUiPreferences } from '@/shared/context/UiPreferencesContext';
import DiscordIcon from '@/modules/sidebar/DiscordIcon';

export const GITHUB_ISSUES_URL = 'https://github.com/siteboon/claudecodeui/issues/new';
export const GITHUB_REPO_URL = 'https://github.com/siteboon/claudecodeui';
export const DISCORD_INVITE_URL = 'https://discord.gg/buxwujPNRE';

type SidebarFooterProps = {
  updateAvailable: boolean;
  restartRequired: boolean;
  releaseInfo: ReleaseInfo | null;
  latestVersion: string | null;
  currentVersion: string;
  onShowVersionModal: () => void;
  onShowSettings: () => void;
  t: TFunction;
};

const rowClass = 'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground md:text-sm';

/** Rendered by SidebarContent at the bottom of the panel for settings, update status and (when enabled) community links. */
export default function SidebarFooter({
  updateAvailable,
  restartRequired,
  releaseInfo,
  latestVersion,
  currentVersion,
  onShowVersionModal,
  onShowSettings,
  t,
}: SidebarFooterProps) {
  const { showCommunityLinks } = useUiPreferences();

  return (
    <div className="flex-shrink-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      {/* Restart-required banner: the running server version differs from the installed/frontend version. */}
      {restartRequired && (
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50/80 px-2.5 py-2 dark:border-amber-700/40 dark:bg-amber-900/15">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500 dark:text-amber-400" />
            <span className="min-w-0 flex-1 text-xs font-medium text-amber-700 dark:text-amber-300">{t('version.restartRequired')}</span>
          </div>
        </div>
      )}

      {updateAvailable && (
        <div className="px-2 py-1.5">
          <button
            className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-blue-50/80 dark:hover:bg-blue-900/15"
            onClick={onShowVersionModal}
          >
            <div className="relative flex-shrink-0">
              <ArrowUpCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-normal text-blue-600 dark:text-blue-300">{releaseInfo?.title || `v${latestVersion}`}</span>
              <span className="text-[10px] text-blue-500/70 dark:text-blue-400/60">{t('version.updateAvailable')}</span>
            </div>
          </button>
        </div>
      )}

      <div className="nav-divider" />

      <div className="flex items-center gap-0.5 px-2 py-1.5">
        <button className={rowClass} onClick={onShowSettings}>
          <Settings className="h-3.5 w-3.5" />
          <span className="text-sm">{t('actions.settings')}</span>
        </button>
        {showCommunityLinks && (
          <>
            <a href={GITHUB_ISSUES_URL} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground" title={t('actions.reportIssue')} aria-label={t('actions.reportIssue')}>
              <Bug className="h-3.5 w-3.5" />
            </a>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground" title={t('actions.joinCommunity')} aria-label={t('actions.joinCommunity')}>
              <DiscordIcon className="h-3.5 w-3.5" />
            </a>
          </>
        )}
      </div>

      {showCommunityLinks && !IS_PLATFORM && (
        <div className="hidden px-3 pb-2 text-center md:block">
          <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground/40 transition-colors hover:text-muted-foreground">
            CloudCLI v{currentVersion} – {t('branding.openSource')}
          </a>
        </div>
      )}
    </div>
  );
}
