import { useEffect } from 'react';

import { IS_EMBEDDED } from '@/shared/utils';

/**
 * Keeps the fixed workspace shell above the virtual keyboard in iOS Safari. Framed (Atlas /chat)
 * the host already sizes the frame to the visual viewport, so the offset stays 0 there.
 */
export function useVisualViewportKeyboardOffset() {
  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport || IS_EMBEDDED) {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      return undefined;
    }

    const updateKeyboardHeight = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - visualViewport.height);
      document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
    };

    visualViewport.addEventListener('resize', updateKeyboardHeight);
    return () => visualViewport.removeEventListener('resize', updateKeyboardHeight);
  }, []);
}
