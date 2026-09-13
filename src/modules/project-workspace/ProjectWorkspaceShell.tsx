import { memo } from 'react';

import { QuickSettingsPanel } from '@/modules/quick-settings-panel';
import ProjectEffects from '@/modules/project-workspace/controllers/ProjectEffects';
import type { ProjectWorkspaceShellProps } from '@/shared/types';
import ProjectCommandPalette from '@/modules/project-workspace/ProjectCommandPalette';
import ProjectMainRegion from '@/modules/project-workspace/ProjectMainRegion';
import ProjectSidebarRegion from '@/modules/project-workspace/ProjectSidebarRegion';
import { isEmbedded } from '@/shared/embed';

/** Rendered by ProjectWorkspaceRoute to lay out the workspace sidebar, main region and global overlays. */
function ProjectWorkspaceShell({
  isMobile,
  ws,
  sendMessage,
  navigate,
}: ProjectWorkspaceShellProps) {
  // Astranote's floating card (shared/embed.ts): the transcript alone, on the card's own ground.
  const embedded = isEmbedded();

  return (
    <div
      className={`fixed inset-0 flex ${embedded ? 'bg-transparent' : 'bg-background'}`}
      style={{ bottom: 'var(--keyboard-height, 0px)' }}
    >
      <ProjectEffects navigate={navigate} />
      {!embedded && <ProjectSidebarRegion isMobile={isMobile} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <ProjectMainRegion
          isMobile={isMobile}
          ws={ws}
          sendMessage={sendMessage}
          navigate={navigate}
        />
      </div>

      {!embedded && <ProjectCommandPalette />}
      {!embedded && <QuickSettingsPanel />}
    </div>
  );
}

export default memo(ProjectWorkspaceShell);
