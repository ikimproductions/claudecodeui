import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';

import { useDeviceSettings } from '@/shared/hooks/useDeviceSettings';
import { useUiPreferences, useSetUiPreference } from '@/shared/context/UiPreferencesContext';
import { useTheme } from '@/shared/context/ThemeContext';
import { useQuickSettingsDrag } from '@/modules/quick-settings-panel/hooks/useQuickSettingsDrag';
import type { PreferenceToggleKey, QuickSettingsPreferences } from '@/shared/types';
import QuickSettingsContent from '@/modules/quick-settings-panel/QuickSettingsContent';
import QuickSettingsHandle from '@/modules/quick-settings-panel/QuickSettingsHandle';
import QuickSettingsPanelHeader from '@/modules/quick-settings-panel/QuickSettingsPanelHeader';
import { QUICK_SETTINGS_TOGGLE_EVENT } from '@/modules/quick-settings-panel/quickSettingsEvents';

/** Exported as QuickSettingsPanel and rendered by the project-workspace module as its slide-out quick settings drawer. */
function QuickSettingsPanelView() {
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useDeviceSettings({ trackPWA: false });
  const { isDarkMode } = useTheme();
  const preferences = useUiPreferences();
  // The workspace header carries the trigger on every tab; the edge handle is the fallback.
  const handleInHeader = preferences.quickSettingsInHeader;
  const setPreference = useSetUiPreference();

  useEffect(() => {
    const toggle = () => setIsOpen((previous) => !previous);
    window.addEventListener(QUICK_SETTINGS_TOGGLE_EVENT, toggle);
    return () => window.removeEventListener(QUICK_SETTINGS_TOGGLE_EVENT, toggle);
  }, []);
  const {
    isDragging,
    handleStyle,
    startDrag,
    consumeSuppressedClick,
  } = useQuickSettingsDrag({ isMobile });

  const quickSettingsPreferences = useMemo<QuickSettingsPreferences>(() => ({
    showRawParameters: preferences.showRawParameters,
    showThinking: preferences.showThinking,
    sendByCtrlEnter: preferences.sendByCtrlEnter,
    voiceEnabled: preferences.voiceEnabled,
  }), [
    preferences.sendByCtrlEnter,
    preferences.showRawParameters,
    preferences.showThinking,
    preferences.voiceEnabled,
  ]);

  const handlePreferenceChange = useCallback(
    (key: PreferenceToggleKey, value: boolean) => {
      setPreference(key, value);
    },
    [setPreference],
  );

  const handleToggleFromHandle = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      // A drag releases a click event as well; this guard prevents accidental toggles.
      if (consumeSuppressedClick()) {
        event.preventDefault();
        return;
      }

      setIsOpen((previous) => !previous);
    },
    [consumeSuppressedClick],
  );

  return (
    <>
      {!handleInHeader && <QuickSettingsHandle
        isOpen={isOpen}
        isDragging={isDragging}
        style={handleStyle}
        onClick={handleToggleFromHandle}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      />}

      <div
        className={`fixed right-0 top-0 z-[9999] h-full w-64 transform border-l border-border bg-background shadow-xl transition-transform duration-150 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${isMobile ? 'h-screen' : ''}`}
      >
        <div className="flex h-full flex-col">
          <QuickSettingsPanelHeader />
          <QuickSettingsContent
            isDarkMode={isDarkMode}
            preferences={quickSettingsPreferences}
            onPreferenceChange={handlePreferenceChange}
          />
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-background/70 transition-opacity duration-150 ease-out"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default memo(QuickSettingsPanelView);
