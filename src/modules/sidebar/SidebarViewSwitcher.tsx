import { Folder, GitBranch, MessageSquare, Terminal, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Tooltip } from '@/shared/ui';
import type { AppTab } from '@/shared/types';
import { cn } from '@/shared/utils';
import { useProjectMainState } from '@/modules/project-workspace/context/ProjectsStateContext';

const VIEWS: { id: AppTab; labelKey: string; fallback: string; icon: LucideIcon }[] = [
  { id: 'chat', labelKey: 'tabs.chat', fallback: 'Chat', icon: MessageSquare },
  { id: 'shell', labelKey: 'tabs.shell', fallback: 'Shell', icon: Terminal },
  { id: 'files', labelKey: 'tabs.files', fallback: 'Files', icon: Folder },
  { id: 'git', labelKey: 'tabs.git', fallback: 'Source Control', icon: GitBranch },
];

type SidebarViewSwitcherProps = {
  isMobile: boolean;
  /** Vertical icon column for the collapsed rail. */
  rail?: boolean;
};

/**
 * Rendered by SidebarHeader (and the collapsed rail) when the workspace views
 * live in the sidebar instead of the workspace header row.
 */
export default function SidebarViewSwitcher({ isMobile, rail = false }: SidebarViewSwitcherProps) {
  const { t } = useTranslation('common');
  const { activeTab, setActiveTab, selectedProject, setSidebarOpen } = useProjectMainState();

  if (!selectedProject) return null;

  const choose = (id: AppTab) => {
    setActiveTab(id);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div
      role="tablist"
      aria-label={t('tabs.views', { defaultValue: 'Workspace views' })}
      data-testid="sidebar-view-switcher"
      className={cn(rail ? 'flex flex-col items-center gap-1' : 'flex rounded-lg bg-muted/50 p-0.5')}
    >
      {VIEWS.map((view) => {
        const isActive = activeTab === view.id;
        const label = t(view.labelKey, { defaultValue: view.fallback });
        return (
          <Tooltip key={view.id} content={label} position={rail ? 'right' : 'bottom'}>
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              onClick={() => choose(view.id)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md text-xs font-normal transition-all',
                rail ? 'h-8 w-8' : 'h-7 flex-1 px-2',
                isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <view.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
              {!rail && isActive && <span className="truncate">{label}</span>}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
