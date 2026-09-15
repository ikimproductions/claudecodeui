import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('@/shared/api', () => ({ api: { getFiles: vi.fn() } }));

import { api } from '@/shared/api';
import { useFileTreeData } from '@/modules/file-tree/hooks/useFileTreeData';
import type { FileTreeNode, Project } from '@/shared/types';

const project = { projectId: 'p1', displayName: 'p', fullPath: '/p' } as Project;
const dir: FileTreeNode = { name: 'd', path: '/p/d', type: 'directory', size: 0, modified: undefined, permissions: '755', permissionsRwx: 'rwxr-xr-x', truncated: true };
const file: FileTreeNode = { name: 'a', path: '/p/d/a', type: 'file', size: 0, modified: undefined, permissions: '644', permissionsRwx: 'rw-r--r--' };
const ok = (body: unknown) => ({ ok: true, json: async () => body, text: async () => JSON.stringify(body) }) as unknown as Response;
const getFiles = api.getFiles as unknown as ReturnType<typeof vi.fn>;

afterEach(() => { getFiles.mockReset(); });

describe('useFileTreeData: the root truncated flag', () => {
  it('reads it from the listing and resets it for an empty project', async () => {
    getFiles.mockResolvedValueOnce(ok({ items: [dir], truncated: true }));
    const { result, rerender } = renderHook((p: Project | null) => useFileTreeData(p), { initialProps: project as Project | null });
    await waitFor(() => expect(result.current.truncated).toBe(true));
    getFiles.mockResolvedValueOnce(ok({ items: [], truncated: false }));
    rerender({ ...project, projectId: 'p2' });
    await waitFor(() => expect(result.current.files).toEqual([]));
    expect(result.current.truncated).toBe(false);
    rerender(null);
    expect(result.current.truncated).toBe(false);
  });

  it('an error response shows the error and never the banner', async () => {
    getFiles.mockResolvedValueOnce({ ok: false, status: 500, text: async () => JSON.stringify({ error: 'boom' }) } as unknown as Response);
    const { result } = renderHook(() => useFileTreeData(project));
    await waitFor(() => expect(result.current.error).toBe('boom'));
    expect(result.current.truncated).toBe(false);
    expect(result.current.files).toEqual([]);
  });

  it('a request cancelled mid-flight writes no state, even when its body arrives later', async () => {
    let finish: (value: Response) => void = () => undefined;
    getFiles.mockImplementationOnce((_id: string, options: { signal?: AbortSignal }) => new Promise<Response>((resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      finish = resolve;
    }));
    const { result, rerender } = renderHook((p: Project | null) => useFileTreeData(p), { initialProps: project as Project | null });
    rerender(null);   // project switched away: the effect cleanup aborts the in-flight request
    await act(async () => { finish(ok({ items: [dir], truncated: true })); await Promise.resolve(); });
    expect(result.current.error).toBeNull();
    expect(result.current.files).toEqual([]);
    expect(result.current.truncated).toBe(false);
  });

  it('a cut subtree keeps its row indicator while an uncut root shows no banner', async () => {
    getFiles.mockResolvedValueOnce(ok({ items: [dir], truncated: false }));
    const { result } = renderHook(() => useFileTreeData(project));
    await waitFor(() => expect(result.current.files[0]?.truncated).toBe(true));
    expect(result.current.truncated).toBe(false);
    getFiles.mockResolvedValueOnce(ok({ items: [file], truncated: true }));
    await act(async () => { await result.current.loadSubtree(dir.path); });
    expect(result.current.files[0]?.children).toEqual([file]);
    expect(result.current.files[0]?.truncated).toBe(true);
    expect(result.current.truncated).toBe(false);
    getFiles.mockResolvedValueOnce(ok({ items: [file], truncated: false }));
    await act(async () => { await result.current.loadSubtree(dir.path); });
    expect(result.current.files[0]?.truncated).toBe(false);
  });
});
