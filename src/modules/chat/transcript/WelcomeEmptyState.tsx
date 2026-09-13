import { useTranslation } from 'react-i18next';

import { useProjectMainState, splitPersonaLabel } from '@/modules/project-workspace';

/** "Morning" / "Afternoon" / "Evening" by the local hour; tests pass the hour in. */
export function greetingKey(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Rendered by ChatMessagesPane for a session with no messages when the
 * provider picker is hidden: a greeting instead of a model card.
 */
export default function WelcomeEmptyState({ hour = new Date().getHours() }: { hour?: number }) {
  const { t } = useTranslation('chat');
  const { selectedProject } = useProjectMainState();
  const persona = selectedProject ? splitPersonaLabel(selectedProject.displayName) : null;
  const key = greetingKey(hour);
  const greeting = t(`welcome.${key}`, {
    defaultValue: key === 'morning' ? 'Good morning.' : key === 'afternoon' ? 'Good afternoon.' : 'Good evening.',
  });

  return (
    <div data-testid="welcome-empty-state" className="flex flex-col items-center justify-center px-4 py-10 text-center">
      {persona?.emoji && <div className="mb-3 text-3xl" aria-hidden="true">{persona.emoji}</div>}
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{greeting}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
        {persona
          ? t('welcome.withPersona', { persona: persona.label, defaultValue: '{{persona}} is here. Say what is on your mind, or tap the mic.' })
          : t('welcome.plain', { defaultValue: 'Say what is on your mind, or tap the mic.' })}
      </p>
    </div>
  );
}
