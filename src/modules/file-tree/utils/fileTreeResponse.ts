import type { FileTreeNode } from '@/shared/types';

export type FileTreeListing = { items: FileTreeNode[]; truncated: boolean };

/** [ai]
 * Reads the `/files` route body. The server answers `{ items, truncated }` so a root
 * listing cut at the entry budget can say so (directory nodes only carry their own
 * flag); a bare array from an older server still reads as an uncut listing, and
 * anything else reads as empty rather than throwing inside a fetch callback.
 */
export function readFileTreeResponse(data: unknown): FileTreeListing {
  if (Array.isArray(data)) {
    return { items: data as FileTreeNode[], truncated: false };
  }
  const items = (data as { items?: unknown } | null)?.items;
  if (!Array.isArray(items)) {
    return { items: [], truncated: false };
  }
  return { items: items as FileTreeNode[], truncated: (data as { truncated?: unknown }).truncated === true };
}
