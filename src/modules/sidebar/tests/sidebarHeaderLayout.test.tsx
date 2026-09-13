import assert from 'node:assert/strict';

import { render } from '@testing-library/react';
import React from 'react';
import { test, vi } from 'vitest';

import type { SidebarProjectListProps } from '@/shared/types';

/**
 * The sidebar header used to stack a labelled mode pill row over a ragged view
 * switcher whose active cell alone carried a label. Both rows are now quiet
 * segmented controls: icon-only mode tabs with the actions at the right, and
 * four equal view cells filling the width.
 */

vi.mock('@/modules/project-workspace/context/ProjectsStateContext', () => ({
  useProjectMainState: () => ({
    activeTab: 'chat',
    setActiveTab: () => {},
    selectedProject: { projectId: 'p1', fullPath: '/p1', displayName: 'p1' },
    setSidebarOpen: () => {},
  }),
}));
vi.mock('@/modules/sidebar/GitHubStarBadge', () => ({ default: () => null }));

const { default: SidebarHeader } = await import('@/modules/sidebar/SidebarHeader');
const { UiPreferencesProvider } = await import('@/shared/context/UiPreferencesContext');

const t = ((key: string, fallback?: string | { defaultValue?: string }) =>
  typeof fallback === 'string' ? fallback : fallback?.defaultValue ?? key) as unknown as SidebarProjectListProps['t'];

const renderHeader = () => render(
  <UiPreferencesProvider>
    <SidebarHeader
      isPWA={false}
      isMobile={false}
      isLoading={false}
      projectsCount={1}
      runningSessionsCount={0}
      archivedSessionsCount={0}
      isArchivedSessionsLoading={false}
      searchFilter=""
      onSearchFilterChange={() => {}}
      onClearSearchFilter={() => {}}
      searchMode="conversations"
      onSearchModeChange={() => {}}
      onRefresh={() => {}}
      isRefreshing={false}
      onCreateProject={() => {}}
      onCollapseSidebar={() => {}}
      t={t}
    />
  </UiPreferencesProvider>,
);

test('mode tabs are icon-only with the actions at the right of the same row', () => {
  const { getByTestId } = renderHeader();
  const toolbar = getByTestId('sidebar-toolbar');
  const modeTabs = [...toolbar.querySelectorAll('[role=tablist][data-testid=sidebar-mode-tabs] [role=tab]')];
  assert.ok(modeTabs.length >= 3);
  for (const tab of modeTabs) assert.equal(tab.textContent, '', `tab ${tab.getAttribute('data-mode')} must carry no text`);
  assert.ok(toolbar.querySelector('[data-testid=sidebar-search-toggle]'));
  assert.ok(toolbar.querySelector('[data-testid=sidebar-collapse]'));
});

test('the view switcher is four equal icon cells filling its row', () => {
  const { getByTestId } = renderHeader();
  const switcher = getByTestId('sidebar-view-switcher');
  const cells = [...switcher.querySelectorAll('[role=tab]')];
  assert.equal(cells.length, 4);
  for (const cell of cells) {
    assert.ok(cell.className.split(' ').includes('flex-1'), 'every cell shares the width');
    assert.equal(cell.textContent, '', 'no cell carries a label, so none is wider');
  }
  assert.ok(switcher.className.includes('w-full'));
});
