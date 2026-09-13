import type { LLMProvider, ProviderModelsDefinition } from '@/shared/types';

/**
 * The postMessage protocol between Astranote's floating Astra card and this frame in embed mode
 * (shared/embed.ts). Astranote → frame: send / abort / new / model / transcribe. Frame → Astranote:
 * ready (the model catalogue) / session / state / transcript / error. `dossier:open` is separate
 * (transcript/DossierCiteLink.tsx). Kept free of React so the codec is unit-testable.
 */
export const EMBED = {
  send: 'astra:send',
  abort: 'astra:abort',
  new: 'astra:new',
  model: 'astra:model',
  transcribe: 'astra:transcribe',
  ready: 'astra:ready',
  session: 'astra:session',
  state: 'astra:state',
  transcript: 'astra:transcript',
  error: 'astra:error',
} as const;

export type EmbedModelOptions = { provider?: LLMProvider; model?: string; effort?: string };

export type EmbedCommand =
  | { type: 'send'; content: string; options: EmbedModelOptions; files: File[] }
  | { type: 'abort' }
  | { type: 'new' }
  | { type: 'model'; options: EmbedModelOptions }
  | { type: 'transcribe'; blob: Blob; name: string };

const PROVIDERS: LLMProvider[] = ['claude', 'codex', 'cursor', 'opencode'];
const PROVIDER_LABEL: Record<LLMProvider, string> = { claude: 'Claude', codex: 'Codex', cursor: 'Cursor', opencode: 'OpenCode' };

const str = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value : undefined);

function readOptions(raw: unknown): EmbedModelOptions {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const provider = str(source.provider);
  return {
    ...(provider && (PROVIDERS as string[]).includes(provider) ? { provider: provider as LLMProvider } : {}),
    ...(str(source.model) ? { model: source.model as string } : {}),
    ...(str(source.effort) ? { effort: source.effort as string } : {}),
  };
}

/** Validates one message from the parent; anything that is not a well-formed command is null. */
export function parseEmbedCommand(data: unknown): EmbedCommand | null {
  if (!data || typeof data !== 'object') return null;
  const message = data as Record<string, unknown>;
  switch (message.type) {
    case EMBED.send: {
      const content = str(message.content);
      if (!content) return null;
      const files = Array.isArray(message.files) ? message.files.filter((f): f is File => typeof File !== 'undefined' && f instanceof File) : [];
      return { type: 'send', content, options: readOptions(message.options), files };
    }
    case EMBED.abort:
      return { type: 'abort' };
    case EMBED.new:
      return { type: 'new' };
    case EMBED.model:
      return { type: 'model', options: readOptions(message) };
    case EMBED.transcribe: {
      if (!(message.blob instanceof Blob)) return null;
      return { type: 'transcribe', blob: message.blob, name: str(message.name) ?? 'recording.webm' };
    }
    default:
      return null;
  }
}

export type EmbedReadyMessage = {
  type: typeof EMBED.ready;
  catalog: {
    providers: {
      id: LLMProvider;
      label: string;
      default: string;
      models: { value: string; label: string; effort: { default: string | null; values: { value: string; label: string }[] } | null }[];
    }[];
  };
  provider: LLMProvider;
  model: string;
  effort: string;
};

/** The `astra:ready` payload: every provider that has at least one model, plus the frame's current choice. */
export function buildReadyMessage(
  catalog: Partial<Record<LLMProvider, ProviderModelsDefinition>>,
  provider: LLMProvider,
  model: string,
  effort: string,
): EmbedReadyMessage {
  const providers = PROVIDERS.flatMap((id) => {
    const definition = catalog[id];
    if (!definition || definition.OPTIONS.length === 0) return [];
    return [{
      id,
      label: PROVIDER_LABEL[id],
      default: definition.DEFAULT,
      models: definition.OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        effort: option.effort
          ? { default: option.effort.default ?? null, values: option.effort.values.map((v) => ({ value: v.value, label: v.description ?? v.value })) }
          : null,
      })),
    }];
  });
  return { type: EMBED.ready, catalog: { providers }, provider, model, effort };
}
