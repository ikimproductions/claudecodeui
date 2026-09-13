/**
 * What the composer's trailing button is right now. Resolved in ChatComposer
 * and rendered by PromptInputSubmit: like claude.ai the send affordance only
 * exists once there is something to send.
 */
export type SendState = 'hidden' | 'send' | 'stop' | 'queue' | 'recording' | 'transcribing';

export type SendStateInput = {
  hasText: boolean;
  hasAttachments: boolean;
  isLoading: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  canQueueDraft: boolean;
};

export function resolveSendState({ hasText, hasAttachments, isLoading, isRecording, isTranscribing, canQueueDraft }: SendStateInput): SendState {
  if (canQueueDraft) return 'queue';
  if (isLoading) return 'stop';
  if (isRecording) return 'recording';
  if (isTranscribing) return 'transcribing';
  return hasText || hasAttachments ? 'send' : 'hidden';
}
