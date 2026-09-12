import { Check, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { api } from '@/shared/api';
import { cn } from '@/shared/utils';
import type { Project } from '@/shared/types';
import { useProjectMainState, useProjectSidebarState } from '@/modules/project-workspace/context/ProjectsStateContext';
import { resolvePersonaProjects, splitPersonaLabel } from '@/modules/project-workspace/utils/personaProjects';

let personaPathsPromise: Promise<string[]> | null = null;

/** Fetches `PERSONA_PROJECTS` once per page load; a failed fetch means "every project". */
function loadPersonaPaths(): Promise<string[]> {
  if (!personaPathsPromise) {
    personaPathsPromise = api.workspaceConfig()
      .then(async (response) => {
        if (!response.ok) return [];
        const body = await response.json() as { personaProjects?: unknown };
        return Array.isArray(body.personaProjects) ? body.personaProjects.filter((p): p is string => typeof p === 'string') : [];
      })
      .catch(() => []);
  }
  return personaPathsPromise;
}

const PERSONA_DOT_CLASSES = [
  'bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-teal-500',
];

function PersonaMark({ project, index, className }: { project: Project; index: number; className?: string }) {
  const { emoji } = splitPersonaLabel(project.displayName);
  if (emoji) return <span className={cn('text-[15px] leading-none', className)} aria-hidden="true">{emoji}</span>;
  return <span className={cn('h-2 w-2 rounded-full', PERSONA_DOT_CLASSES[index % PERSONA_DOT_CLASSES.length], className)} aria-hidden="true" />;
}

/**
 * Rendered by WorkspaceHeader: the current persona (project) as a badge; when
 * more than one persona is configured, tapping it opens a menu to switch.
 */
export default function PersonaPicker() {
  const { t } = useTranslation('sidebar');
  const { selectedProject, handleProjectSelect } = useProjectMainState();
  const { sidebarSharedProps } = useProjectSidebarState();
  const projects = sidebarSharedProps.projects as Project[];
  const [personaPaths, setPersonaPaths] = useState<string[] | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    let active = true;
    void loadPersonaPaths().then((paths) => { if (active) setPersonaPaths(paths); });
    return () => { active = false; };
  }, []);

  const personas = useMemo(
    () => resolvePersonaProjects(personaPaths ?? [], projects),
    [personaPaths, projects],
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // [ai] The header is its own stacking context (backdrop blur), so an absolutely
  // positioned menu would paint under the transcript; portal it to the body instead.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) setAnchor({ top: rect.bottom + 6, left: rect.left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  const pick = useCallback((project: Project) => {
    setOpen(false);
    if (project.projectId !== selectedProject?.projectId) handleProjectSelect(project);
  }, [handleProjectSelect, selectedProject?.projectId]);

  if (!selectedProject) return null;

  const current = splitPersonaLabel(selectedProject.displayName);
  const currentIndex = Math.max(0, personas.findIndex((p) => p.projectId === selectedProject.projectId));
  // No menu until the config answers: before that the list would be every project.
  const switchable = personaPaths !== null && personas.length > 1;
  const menuLabel = t('persona.switch', { defaultValue: 'Switch persona' });

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        data-testid="persona-badge"
        onClick={() => switchable && setOpen((value) => !value)}
        aria-haspopup={switchable ? 'menu' : undefined}
        aria-expanded={switchable ? open : undefined}
        aria-label={switchable ? menuLabel : selectedProject.displayName}
        title={switchable ? menuLabel : selectedProject.fullPath}
        className={cn(
          'flex h-8 max-w-[11rem] items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 pl-2.5 pr-2 text-sm font-medium text-foreground transition-colors',
          switchable ? 'hover:bg-muted' : 'cursor-default',
        )}
      >
        <PersonaMark project={selectedProject} index={currentIndex} />
        <span className="truncate">{current.label}</span>
        {switchable && <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />}
      </button>

      {open && anchor && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label={menuLabel}
          style={{ position: 'fixed', top: anchor.top, left: anchor.left }}
          className="z-[60] min-w-[13rem] overflow-hidden rounded-xl border border-border/60 bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {personas.map((project, index) => {
            const { label } = splitPersonaLabel(project.displayName);
            const isCurrent = project.projectId === selectedProject.projectId;
            return (
              <button
                key={project.projectId}
                type="button"
                role="menuitemradio"
                aria-checked={isCurrent}
                onClick={() => pick(project)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent',
                  isCurrent && 'bg-accent/60',
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center"><PersonaMark project={project} index={index} /></span>
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {isCurrent && <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
