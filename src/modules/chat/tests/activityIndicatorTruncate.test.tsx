import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ActivityIndicator from '@/modules/chat/composer/ActivityIndicator';

const activity = { statusText: 'x'.repeat(119) + '…', canInterrupt: true, startedAt: Date.now() };

describe('ActivityIndicator status line', () => {
  it('truncates a long live thinking line in the transcript row', () => {
    const { container } = render(<ActivityIndicator activity={activity} variant="inline" />);
    const label = container.querySelector('[data-testid=transcript-activity] .truncate');
    expect(label?.textContent).toContain('xxxx');
    expect(label?.className).toContain('min-w-0');
  });

  it('truncates it in the composer tab too, capped on narrow screens', () => {
    const { container } = render(<ActivityIndicator activity={activity} />);
    const label = container.querySelector('.chat-activity-tab .truncate');
    expect(label?.className).toContain('max-w-[55vw]');
  });
});
