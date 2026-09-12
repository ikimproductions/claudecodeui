import type { PermissionMode } from '@/shared/types';

/** Build-time default permission mode (`VITE_DEFAULT_PERMISSION_MODE`); empty means the provider's own default. */
export const DEFAULT_PERMISSION_MODE_ENV = (import.meta.env?.VITE_DEFAULT_PERMISSION_MODE ?? '') as string;

/**
 * Picks the mode a fresh session starts in: the configured default when the
 * provider supports it, otherwise the provider's own default.
 */
export function resolveDefaultPermissionMode(
  configured: string | undefined,
  validModes: readonly string[],
  providerDefault: PermissionMode,
): PermissionMode {
  const wanted = (configured ?? '').trim();
  if (wanted && validModes.includes(wanted)) return wanted as PermissionMode;
  return providerDefault;
}
