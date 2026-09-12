import assert from 'node:assert/strict';
import test from 'node:test';

import { ensurePlatformUser } from '@/modules/auth/platform-user.js';

function fakeUsers() {
  const rows: Array<{ id: number; username: string; hash: string; onboarded: boolean }> = [];
  return {
    rows,
    hasUsers: () => rows.length > 0,
    createUser: (username: string, hash: string) => { rows.push({ id: rows.length + 1, username, hash, onboarded: false }); return { id: rows.length }; },
    completeOnboarding: (id: number) => { rows[id - 1].onboarded = true; },
    hashPassword: async (password: string) => `hashed:${password}`,
  };
}

test('first boot creates one onboarded user with a random password', async () => {
  const users = fakeUsers();
  assert.equal(await ensurePlatformUser(users, 'atlas'), true);
  assert.equal(users.rows.length, 1);
  assert.equal(users.rows[0].username, 'atlas');
  assert.equal(users.rows[0].onboarded, true);
  assert.match(users.rows[0].hash, /^hashed:[0-9a-f]{48}$/);
});

test('an existing user is left alone', async () => {
  const users = fakeUsers();
  users.createUser('isaac', 'x');
  assert.equal(await ensurePlatformUser(users), false);
  assert.equal(users.rows.length, 1);
  assert.equal(users.rows[0].onboarded, false);
});
