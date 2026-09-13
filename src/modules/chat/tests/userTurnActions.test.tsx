import assert from 'node:assert/strict';

import { render } from '@testing-library/react';
import React from 'react';
import { test } from 'vitest';

import MessageComponent from '@/modules/chat/transcript/MessageComponent';
import { formatRelativeTime } from '@/modules/chat/utils/chatFormatting';
import { UiPreferencesProvider } from '@/shared/context/UiPreferencesContext';
import type { ChatMessage, DiffLine } from '@/shared/types';

/**
 * A user turn used to carry its time and buttons inside the bubble. Like
 * claude.ai the bubble now holds only the text; the relative time, edit, fork
 * and copy sit in a row under it that appears on hover or focus of the turn.
 */

const NOW = new Date('2026-09-13T20:00:00.000Z');

test('formatRelativeTime reads like claude.ai', () => {
  assert.equal(formatRelativeTime('2026-09-13T19:59:40.000Z', NOW), 'just now');
  assert.equal(formatRelativeTime('2026-09-13T19:55:00.000Z', NOW), '5 minutes ago');
  assert.equal(formatRelativeTime('2026-09-13T19:59:00.000Z', NOW), '1 minute ago');
  assert.equal(formatRelativeTime('2026-09-13T00:00:00.000Z', NOW), '20 hours ago');
  assert.equal(formatRelativeTime('2026-09-10T20:00:00.000Z', NOW), '3 days ago');
  assert.equal(formatRelativeTime('2026-07-01T20:00:00.000Z', NOW), new Date('2026-07-01T20:00:00.000Z').toLocaleDateString());
  assert.equal(formatRelativeTime('nope', NOW), '');
  assert.equal(formatRelativeTime(undefined, NOW), '');
});

const userMessage = (): ChatMessage => ({
  type: 'user',
  content: 'can i ask for a discount',
  timestamp: '2026-09-13T00:00:00.000Z',
  transcriptAnchorId: 'anchor-1',
});

const createDiff = (): DiffLine[] => [];

test('the bubble holds only the text and the action row sits under it, revealed on hover', () => {
  const { getByTestId, getByText } = render(
    <UiPreferencesProvider>
      <MessageComponent
        message={userMessage()}
        prevMessage={null}
        createDiff={createDiff}
        provider="claude"
        onEditMessage={() => {}}
        onForkFromMessage={() => {}}
      />
    </UiPreferencesProvider>,
  );
  const bubble = getByTestId('user-bubble');
  const actions = getByTestId('user-turn-actions');
  assert.ok(bubble.textContent?.includes('can i ask for a discount'));
  assert.ok(!bubble.contains(actions), 'the action row must not be inside the bubble');
  assert.equal(actions.parentElement, bubble.parentElement, 'the action row is the bubble\'s sibling');
  assert.ok(actions.className.includes('opacity-0'));
  assert.ok(actions.className.includes('group-hover/turn:opacity-100'));
  assert.ok(actions.className.includes('focus-within:opacity-100'));
  assert.ok(actions.className.includes('[@media(hover:none)]:opacity-100'), 'touch devices have no hover: the row stays visible');
  assert.ok(getByText(/ago|just now/).closest('[data-testid=user-turn-actions]'));
  assert.equal(actions.querySelectorAll('button').length, 3, 'edit, fork, copy');
});
