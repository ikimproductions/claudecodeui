import assert from 'node:assert/strict';

import { render } from '@testing-library/react';
import React from 'react';
import { test } from 'vitest';

import { PromptInput, PromptInputSubmit } from '@/modules/chat/composer/PromptInput';
import { resolveSendState } from '@/modules/chat/composer/sendState';

/**
 * The send button used to sit in the pill as a filled disc even when there was
 * nothing to send. Like claude.ai it is now invisible and inert while the input
 * is empty and idle, a quiet ↵ once there is text, the stop square while
 * streaming and ↑ for a draft queued behind a running turn.
 */

const base = { hasText: false, hasAttachments: false, isLoading: false, isRecording: false, isTranscribing: false, canQueueDraft: false };

test('resolveSendState picks one state per composer situation', () => {
  assert.equal(resolveSendState(base), 'hidden');
  assert.equal(resolveSendState({ ...base, hasText: true }), 'send');
  assert.equal(resolveSendState({ ...base, hasAttachments: true }), 'send');
  assert.equal(resolveSendState({ ...base, isLoading: true }), 'stop');
  assert.equal(resolveSendState({ ...base, isLoading: true, hasText: true, canQueueDraft: true }), 'queue');
  assert.equal(resolveSendState({ ...base, isRecording: true }), 'recording');
  assert.equal(resolveSendState({ ...base, isTranscribing: true }), 'transcribing');
});

const renderSubmit = (sendState: 'hidden' | 'send' | 'stop' | 'recording') =>
  render(
    React.createElement(PromptInput, { status: sendState === 'stop' ? 'streaming' : 'ready' },
      React.createElement(PromptInputSubmit, { 'aria-label': 'submit', sendState })),
  );

test('a hidden send button is not tabbable and is marked hidden', () => {
  const { getByLabelText } = renderSubmit('hidden');
  const button = getByLabelText('submit');
  assert.equal(button.getAttribute('tabindex'), '-1');
  assert.equal(button.getAttribute('data-send-state'), 'hidden');
  assert.ok(button.className.includes('opacity-0'));
  assert.ok(button.className.includes('pointer-events-none'));
});

test('with text the button shows the return glyph and is a submit', () => {
  const { getByLabelText } = renderSubmit('send');
  const button = getByLabelText('submit');
  assert.equal(button.getAttribute('type'), 'submit');
  assert.equal(button.getAttribute('data-send-state'), 'send');
  assert.equal(button.getAttribute('tabindex'), null);
  assert.ok(button.querySelector('.lucide-corner-down-left'), 'expected the ↵ icon');
});

test('while streaming the stop square stays visible', () => {
  const { getByLabelText } = renderSubmit('stop');
  const button = getByLabelText('submit');
  assert.equal(button.getAttribute('type'), 'button');
  assert.ok(!button.className.includes('opacity-0'));
});

test('recording shows a filled send arrow, since a click stops the mic and sends', () => {
  const { getByLabelText } = renderSubmit('recording');
  const button = getByLabelText('submit');
  assert.ok(button.querySelector('.lucide-arrow-up'), 'expected the ↑ icon');
  assert.ok(!button.className.includes('opacity-0'));
});
