import { useTranslation } from 'react-i18next';

import { DarkModeToggle } from '@/shared/ui';
import type { CodeEditorSettingsState, ProjectSortOrder } from '@/shared/types';
import { LanguageSelector } from '@/modules/i18n';
import SettingsCard from '@/modules/settings/SettingsCard';
import SettingsRow from '@/modules/settings/SettingsRow';
import SettingsSection from '@/modules/settings/SettingsSection';
import SettingsToggle from '@/modules/settings/SettingsToggle';
import { useSetUiPreference, useUiPreferences } from '@/shared/context/UiPreferencesContext';
import type { UiPreferenceKey } from '@/shared/uiPreferences';

/** Layout flags: each hides one element of the workspace; the code behind it stays. */
const LAYOUT_FLAGS: { key: UiPreferenceKey; label: string; description: string }[] = [
  { key: 'workspaceTabsInSidebar', label: 'Views in the sidebar', description: 'Chat, Shell, Files and Source Control as a row in the sidebar instead of the header.' },
  { key: 'showProjectsTab', label: 'Projects list', description: 'Show the Projects tab in the sidebar (Conversations is the default list).' },
  { key: 'showNewProjectButton', label: 'New project button', description: 'Show the + button that creates a project.' },
  { key: 'showBrandHeader', label: 'Brand header', description: 'Show the CloudCLI wordmark at the top of the sidebar.' },
  { key: 'showCommunityLinks', label: 'Community links', description: 'Report Issue and Join Community in the sidebar footer.' },
  { key: 'showProviderPicker', label: 'Provider card on new chats', description: 'Show the provider/model card instead of a greeting when a session is empty.' },
  { key: 'activityInTranscript', label: 'Status line in the conversation', description: 'Show "Thinking… 12s" inside the transcript instead of as a tab above the composer.' },
  { key: 'personaInComposer', label: 'Persona picker under the composer', description: 'On: the badge moves from the header to the row under the composer.' },
  { key: 'quickSettingsInComposer', label: 'Quick settings in the composer', description: 'A sliders button in the composer bar opens quick settings; the edge handle on the right is hidden.' },
  { key: 'showComposerExtras', label: 'Composer extras', description: 'Token counter, slash-command button, schedule, clear and the keyboard hint under the composer.' },
];

type AppearanceSettingsTabProps = {
  projectSortOrder: ProjectSortOrder;
  onProjectSortOrderChange: (value: ProjectSortOrder) => void;
  codeEditorSettings: CodeEditorSettingsState;
  onCodeEditorWordWrapChange: (value: boolean) => void;
  onCodeEditorShowMinimapChange: (value: boolean) => void;
  onCodeEditorLineNumbersChange: (value: boolean) => void;
  onCodeEditorFontSizeChange: (value: string) => void;
};

/** Rendered by Settings for the "appearance" tab, covering theme, project sorting and code editor preferences. */
export default function AppearanceSettingsTab({
  projectSortOrder,
  onProjectSortOrderChange,
  codeEditorSettings,
  onCodeEditorWordWrapChange,
  onCodeEditorShowMinimapChange,
  onCodeEditorLineNumbersChange,
  onCodeEditorFontSizeChange,
}: AppearanceSettingsTabProps) {
  const { t } = useTranslation('settings');
  const uiPreferences = useUiPreferences();
  const setUiPreference = useSetUiPreference();

  return (
    <div className="space-y-8">
      <SettingsSection title={t('appearanceSettings.layout.title', { defaultValue: 'Layout' })}>
        <SettingsCard>
          {LAYOUT_FLAGS.map((flag) => (
            <SettingsRow
              key={flag.key}
              label={t(`appearanceSettings.layout.${flag.key}.label`, { defaultValue: flag.label })}
              description={t(`appearanceSettings.layout.${flag.key}.description`, { defaultValue: flag.description })}
            >
              <SettingsToggle
                checked={uiPreferences[flag.key]}
                onChange={(value) => setUiPreference(flag.key, value)}
                ariaLabel={t(`appearanceSettings.layout.${flag.key}.label`, { defaultValue: flag.label })}
              />
            </SettingsRow>
          ))}
        </SettingsCard>
      </SettingsSection>

      <SettingsSection title={t('appearanceSettings.darkMode.label')}>
        <SettingsCard>
          <SettingsRow
            label={t('appearanceSettings.darkMode.label')}
            description={t('appearanceSettings.darkMode.description')}
          >
            <DarkModeToggle ariaLabel={t('appearanceSettings.darkMode.label')} />
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection title={t('mainTabs.appearance')}>
        <SettingsCard>
          <LanguageSelector />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection title={t('appearanceSettings.projectSorting.label')}>
        <SettingsCard>
          <SettingsRow
            label={t('appearanceSettings.projectSorting.label')}
            description={t('appearanceSettings.projectSorting.description')}
          >
            <select
              value={projectSortOrder}
              onChange={(event) => onProjectSortOrderChange(event.target.value as ProjectSortOrder)}
              className="w-full touch-manipulation rounded-lg border border-input bg-card p-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary sm:w-36"
            >
              <option value="name">{t('appearanceSettings.projectSorting.alphabetical')}</option>
              <option value="date">{t('appearanceSettings.projectSorting.recentActivity')}</option>
            </select>
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection title={t('appearanceSettings.codeEditor.title')}>
        <SettingsCard divided>
          <SettingsRow
            label={t('appearanceSettings.codeEditor.wordWrap.label')}
            description={t('appearanceSettings.codeEditor.wordWrap.description')}
          >
            <SettingsToggle
              checked={codeEditorSettings.wordWrap}
              onChange={onCodeEditorWordWrapChange}
              ariaLabel={t('appearanceSettings.codeEditor.wordWrap.label')}
            />
          </SettingsRow>

          <SettingsRow
            label={t('appearanceSettings.codeEditor.showMinimap.label')}
            description={t('appearanceSettings.codeEditor.showMinimap.description')}
          >
            <SettingsToggle
              checked={codeEditorSettings.showMinimap}
              onChange={onCodeEditorShowMinimapChange}
              ariaLabel={t('appearanceSettings.codeEditor.showMinimap.label')}
            />
          </SettingsRow>

          <SettingsRow
            label={t('appearanceSettings.codeEditor.lineNumbers.label')}
            description={t('appearanceSettings.codeEditor.lineNumbers.description')}
          >
            <SettingsToggle
              checked={codeEditorSettings.lineNumbers}
              onChange={onCodeEditorLineNumbersChange}
              ariaLabel={t('appearanceSettings.codeEditor.lineNumbers.label')}
            />
          </SettingsRow>

          <SettingsRow
            label={t('appearanceSettings.codeEditor.fontSize.label')}
            description={t('appearanceSettings.codeEditor.fontSize.description')}
          >
            <select
              value={codeEditorSettings.fontSize}
              onChange={(event) => onCodeEditorFontSizeChange(event.target.value)}
              className="w-full touch-manipulation rounded-lg border border-input bg-card p-2.5 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary sm:w-28"
            >
              <option value="10">10px</option>
              <option value="11">11px</option>
              <option value="12">12px</option>
              <option value="13">13px</option>
              <option value="14">14px</option>
              <option value="15">15px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
              <option value="20">20px</option>
            </select>
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>
    </div>
  );
}
