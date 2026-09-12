import * as React from 'react';
import { SendHorizonalIcon, SquareIcon } from 'lucide-react';

import { cn } from '@/shared/utils';
import { Button, Tooltip } from '@/shared/ui';

/* ─── Context ────────────────────────────────────────────────────── */

type PromptInputStatus = 'ready' | 'submitted' | 'streaming' | 'error';

type PromptInputContextValue = {
  status: PromptInputStatus;
};

const PromptInputContext = React.createContext<PromptInputContextValue | null>(null);

/** Read by PromptInputSubmit, which is only ever rendered inside PromptInput. */
const usePromptInput = () => {
  const context = React.useContext(PromptInputContext);
  if (!context) {
    throw new Error('PromptInput components must be used within PromptInput');
  }
  return context;
};

/* ─── PromptInput (root form) ────────────────────────────────────── */

export type PromptInputProps = {
  status?: PromptInputStatus;
} & React.FormHTMLAttributes<HTMLFormElement>;

/** Composer form shell, used by ChatComposer. */
export const PromptInput = React.forwardRef<HTMLFormElement, PromptInputProps>(
  ({ className, status = 'ready', children, ...props }, ref) => {
    const contextValue = React.useMemo(() => ({ status }), [status]);

    return (
      <PromptInputContext.Provider value={contextValue}>
        <form
          ref={ref}
          data-slot="prompt-input"
          className={cn(
            'relative overflow-hidden rounded-[1.375rem] border border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] duration-200 focus-within:border-border focus-within:shadow-[0_2px_10px_rgba(0,0,0,0.06)]',
            className
          )}
          {...props}
        >
          {children}
        </form>
      </PromptInputContext.Provider>
    );
  }
);
PromptInput.displayName = 'PromptInput';

/* ─── PromptInputHeader ──────────────────────────────────────────── */

/** Attachment/queue row above the composer textarea, used by ChatComposer. */
export const PromptInputHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="prompt-input-header"
    className={cn('px-3 pt-3', className)}
    {...props}
  />
));
PromptInputHeader.displayName = 'PromptInputHeader';

/* ─── PromptInputBody ────────────────────────────────────────────── */

/** Wrapper around the composer textarea, used by ChatComposer. */
export const PromptInputBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="prompt-input-body"
    className={cn('relative min-w-0 flex-1', className)}
    {...props}
  />
));
PromptInputBody.displayName = 'PromptInputBody';

/* ─── PromptInputRow ─────────────────────────────────────────────── */

/** The pill's one line: leading button, textarea, trailing buttons; used by ChatComposer. */
export const PromptInputRow = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="prompt-input-row"
    className={cn('flex items-end gap-1 px-2 py-1', className)}
    {...props}
  />
));
PromptInputRow.displayName = 'PromptInputRow';

/* ─── PromptInputTextarea ────────────────────────────────────────── */

/** Auto-growing message textarea, used by ChatComposer. */
export const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    data-slot="prompt-input-textarea"
    className={cn(
      'chat-input-placeholder block max-h-[40vh] w-full resize-none overflow-y-auto bg-transparent px-1 py-2.5 text-[15px] leading-6 text-foreground placeholder-muted-foreground/60 focus:outline-none sm:max-h-[300px]',
      className
    )}
    {...props}
  />
));
PromptInputTextarea.displayName = 'PromptInputTextarea';

/* ─── PromptInputFooter ──────────────────────────────────────────── */

/** Row below the composer textarea, used by ChatComposer. */
export const PromptInputFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="prompt-input-footer"
    className={cn('flex items-center justify-between px-2 pt-1.5', className)}
    {...props}
  />
));
PromptInputFooter.displayName = 'PromptInputFooter';

/* ─── PromptInputTools ───────────────────────────────────────────── */

/** Left-hand tool cluster in the composer footer, used by ChatComposer. */
export const PromptInputTools = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="prompt-input-tools"
    className={cn('flex items-center gap-1', className)}
    {...props}
  />
));
PromptInputTools.displayName = 'PromptInputTools';

/* ─── PromptInputButton ──────────────────────────────────────────── */

export type PromptInputButtonTooltip = {
  content: React.ReactNode;
  shortcut?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
};

export type PromptInputButtonProps = {
  tooltip?: PromptInputButtonTooltip;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/** Icon button in the composer footer, used by ChatComposer and VoiceInputButton. */
export const PromptInputButton = React.forwardRef<HTMLButtonElement, PromptInputButtonProps>(
  ({ className, tooltip, children, ...props }, ref) => {
    const button = (
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8 rounded-full text-muted-foreground hover:text-foreground [&_svg]:size-[18px]', className)}
        {...props}
      >
        {children}
      </Button>
    );

    if (tooltip) {
      return (
        <Tooltip
          content={
            tooltip.shortcut ? (
              <span className="flex items-center gap-1.5">
                {tooltip.content}
                <kbd className="rounded bg-white/20 px-1 text-[10px]">{tooltip.shortcut}</kbd>
              </span>
            ) : (
              tooltip.content
            )
          }
          position={tooltip.side ?? 'top'}
        >
          {button}
        </Tooltip>
      );
    }

    return button;
  }
);
PromptInputButton.displayName = 'PromptInputButton';

/* ─── PromptInputSubmit ──────────────────────────────────────────── */

export type PromptInputSubmitProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/** Send/stop button of the composer, used by ChatComposer. */
export const PromptInputSubmit = React.forwardRef<HTMLButtonElement, PromptInputSubmitProps>(
  ({ className, children, ...props }, ref) => {
    // The status comes from the PromptInput root, which is the only place it is set.
    const { status } = usePromptInput();
    const isActive = status === 'submitted' || status === 'streaming';

    return (
      <Button
        ref={ref}
        type={isActive ? 'button' : 'submit'}
        variant="default"
        size="icon"
        className={cn('h-8 w-8 shrink-0 rounded-full', className)}
        {...props}
      >
        {children ?? (isActive ? (
          <SquareIcon className="h-3.5 w-3.5 fill-current" />
        ) : (
          <SendHorizonalIcon className="h-4 w-4" />
        ))}
      </Button>
    );
  }
);
PromptInputSubmit.displayName = 'PromptInputSubmit';

