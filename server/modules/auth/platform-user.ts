import { randomBytes } from 'node:crypto';

type PlatformUserDependencies = {
  hasUsers(): boolean;
  createUser(username: string, passwordHash: string): { id: number | bigint };
  completeOnboarding(userId: number): void;
  hashPassword(password: string): Promise<string>;
  log?(message: string): void;
};

/**
 * Platform mode (VITE_IS_PLATFORM=true) trusts the network and serves one user: the auth middleware and the
 * WebSocket upgrade both pick the first database row. A fresh install has none, so the first boot creates it
 * with an unguessable password and marks onboarding done — no account form, no wizard.
 */
export async function ensurePlatformUser(dependencies: PlatformUserDependencies, username = 'atlas'): Promise<boolean> {
  if (dependencies.hasUsers()) return false;
  const passwordHash = await dependencies.hashPassword(randomBytes(24).toString('hex'));
  const created = dependencies.createUser(username, passwordHash);
  dependencies.completeOnboarding(Number(created.id));
  dependencies.log?.(`[INFO] Platform mode: created the single user "${username}"`);
  return true;
}
