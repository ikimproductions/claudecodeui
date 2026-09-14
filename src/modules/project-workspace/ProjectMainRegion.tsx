import { memo, useCallback } from 'react';

import { useProjectCommandState, useProjectMainState } from '@/modules/project-workspace/context/ProjectsStateContext';
import { api } from '@/shared/api';
import { embedSearch } from '@/shared/embed';
import type { SessionEstablishedContext, SessionNavigationOptions,ProjectWorkspaceShellProps } from '@/shared/types';
import WorkspaceMain from '@/modules/project-workspace/WorkspaceMain';

/** Rendered by ProjectWorkspaceShell to bind this module's project state to WorkspaceMain. */
function ProjectMainRegion({
  isMobile,
  ws,
  sendMessage,
  navigate,
}: ProjectWorkspaceShellProps) {
  const {
    selectedProject,
    selectedSession,
    activeTab,
    setActiveTab,
    setSidebarOpen,
    isLoadingProjects,
    openSettings,
    externalMessageUpdate,
    newSessionTrigger,
    registerOptimisticSession,
    handleProjectSelect,
    refreshProjectsSilently,
    projectSessions,
    handleSessionDelete,
  } = useProjectMainState();
  const { handleNewSession } = useProjectCommandState();

  const handleOpenSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, [setSidebarOpen]);

  const handleNavigateToSession = useCallback((
    targetSessionId: string,
    options?: SessionNavigationOptions,
  ) => {
    // In Astranote's frame the `project` + `embed` query rides along, or the first send would drop the frame out of embed mode.
    navigate(`/session/${targetSessionId}${embedSearch()}`, { replace: Boolean(options?.replace) });
  }, [navigate]);

  // Embed bridge `astra:new`: a fresh conversation in the same persona project.
  const handleNewSessionHere = useCallback(() => {
    if (selectedProject) handleNewSession(selectedProject);
  }, [handleNewSession, selectedProject]);

  // Embed bridge `astra:rename` / `astra:delete` (the history rows' … menu): the same calls the sidebar makes, then the list refreshes.
  const handleEmbedRename = useCallback(async (sessionId: string, title: string) => {
    const response = await api.renameSession(sessionId, title);
    if (!response.ok) throw new Error(`rename ${response.status}`);
    await refreshProjectsSilently();
  }, [refreshProjectsSilently]);
  const handleEmbedDelete = useCallback(async (sessionId: string) => {
    const response = await api.deleteSession(sessionId);
    if (!response.ok) throw new Error(`delete ${response.status}`);
    handleSessionDelete(sessionId);
  }, [handleSessionDelete]);

  const handleSessionEstablished = useCallback((
    targetSessionId: string,
    context: SessionEstablishedContext,
  ) => {
    registerOptimisticSession({ sessionId: targetSessionId, ...context });
  }, [registerOptimisticSession]);

  const handleProjectsRefresh = useCallback(() => {
    void refreshProjectsSilently();
  }, [refreshProjectsSilently]);

  return (
    <WorkspaceMain
      selectedProject={selectedProject}
      selectedSession={selectedSession}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      ws={ws}
      sendMessage={sendMessage}
      isMobile={isMobile}
      onMenuClick={handleOpenSidebar}
      isLoading={isLoadingProjects}
      onNavigateToSession={handleNavigateToSession}
      onSessionEstablished={handleSessionEstablished}
      onShowSettings={openSettings}
      externalMessageUpdate={externalMessageUpdate}
      newSessionTrigger={newSessionTrigger}
      onProjectSelect={handleProjectSelect}
      onProjectsRefresh={handleProjectsRefresh}
      onNewSession={handleNewSessionHere}
      sessions={projectSessions}
      onRenameSession={handleEmbedRename}
      onDeleteSession={handleEmbedDelete}
    />
  );
}

export default memo(ProjectMainRegion);
