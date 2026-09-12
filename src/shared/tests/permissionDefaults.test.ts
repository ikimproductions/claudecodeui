import assert from 'node:assert/strict';

import { test } from 'vitest';

import { resolveDefaultPermissionMode } from '@/shared/permissionDefaults';

const modes = ['default', 'acceptEdits', 'bypassPermissions', 'plan'];

test('the configured default wins when the provider supports it', () => {
  assert.equal(resolveDefaultPermissionMode('bypassPermissions', modes, 'default'), 'bypassPermissions');
  assert.equal(resolveDefaultPermissionMode(' plan ', modes, 'default'), 'plan');
});

test('unset, blank or unsupported values fall back to the provider default', () => {
  assert.equal(resolveDefaultPermissionMode(undefined, modes, 'default'), 'default');
  assert.equal(resolveDefaultPermissionMode('', modes, 'acceptEdits'), 'acceptEdits');
  assert.equal(resolveDefaultPermissionMode('bypassPermissions', ['default', 'plan'], 'default'), 'default');
});
