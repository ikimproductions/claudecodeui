import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

import FileTreeBody from '@/modules/file-tree/FileTreeBody';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, opts?: { count?: number }) => (opts?.count ? `${key}:${opts.count}` : key) }) }));

const node = { name: 'a', path: '/p/a', type: 'file' as const, size: 0, modified: undefined, permissions: '644', permissionsRwx: 'rw-r--r--' };
const noop = () => undefined;
const baseProps = {
  files: [node], filteredFiles: [node], error: null, searchQuery: '', viewMode: 'simple' as const, expandedDirs: new Set<string>(),
  onItemClick: noop, renderFileIcon: () => null, formatFileSize: () => '', formatRelativeTime: () => '',
  renamingItem: null, renameValue: '', setRenameValue: noop, handleConfirmRename: noop, handleCancelRename: noop,
  renameInputRef: { current: null }, operationLoading: false,
};

describe('FileTreeBody truncated root', () => {
  it('renders the truncated line only when the root listing was cut', () => {
    const { container, rerender } = render(<FileTreeBody {...(baseProps as any)} truncated={false} />);
    expect(container.textContent).not.toContain('fileTree.truncatedRoot');
    rerender(<FileTreeBody {...(baseProps as any)} truncated />);
    expect(container.textContent).toContain('fileTree.truncatedRoot:10000');
  });
  it('never renders the line while the tree is in an error or empty state', () => {
    const { container, rerender } = render(<FileTreeBody {...(baseProps as any)} error="boom" truncated />);
    expect(container.textContent).not.toContain('fileTree.truncatedRoot');
    rerender(<FileTreeBody {...(baseProps as any)} files={[]} filteredFiles={[]} truncated />);
    expect(container.textContent).not.toContain('fileTree.truncatedRoot');
  });
});
