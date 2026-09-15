import { describe, expect, it } from 'vitest';

import { readFileTreeResponse } from '@/modules/file-tree/utils/fileTreeResponse';

const node = { name: 'a', path: '/p/a', type: 'file' as const, size: 0, modified: undefined, permissions: '644', permissionsRwx: 'rw-r--r--' };

describe('readFileTreeResponse', () => {
  it('unpacks the { items, truncated } listing', () => {
    expect(readFileTreeResponse({ items: [node], truncated: true })).toEqual({ items: [node], truncated: true });
  });
  it('tolerates a bare array from an older server (never truncated)', () => {
    expect(readFileTreeResponse([node])).toEqual({ items: [node], truncated: false });
  });
  it('never throws on garbage: empty listing', () => {
    expect(readFileTreeResponse(null)).toEqual({ items: [], truncated: false });
    expect(readFileTreeResponse({ items: 'nope' })).toEqual({ items: [], truncated: false });
    expect(readFileTreeResponse({ items: [node], truncated: 'yes' })).toEqual({ items: [node], truncated: false });
  });
});
