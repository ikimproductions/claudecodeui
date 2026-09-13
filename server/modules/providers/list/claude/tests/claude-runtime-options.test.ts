import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { mapCliOptionsToSDK } from '@/modules/providers/list/claude/claude-runtime.provider.js';

describe('claude runtime sdk options', () => {
  it('asks the SDK for partial messages so text streams token by token', () => {
    const opts = mapCliOptionsToSDK({ cwd: process.cwd() });
    assert.equal(opts.includePartialMessages, true);
  });
});
