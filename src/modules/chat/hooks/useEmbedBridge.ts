import { useCallback, useEffect, useRef } from 'react';

import { transcribeVoice } from '@/shared/api';
import { writeSelectedProvider } from '@/shared/selectedProvider';
import type { LLMProvider, ProjectSession, ProviderModelsDefinition } from '@/shared/types';
import { EMBED, buildReadyMessage, parseEmbedCommand, type EmbedModelOptions, buildSessionsMessage } from '@/modules/chat/utils/embedBridge';

type UseEmbedBridgeArgs = {
  /** Only true inside Astranote's frame (`shared/embed.ts`); everything is inert otherwise. */
  enabled: boolean;
  /** The parent's origin (`embedOrigin()`): commands from any other origin are ignored and nothing is posted elsewhere. */
  parentOrigin: string;
  provider: LLMProvider;
  setProvider: (provider: LLMProvider) => void;
  providerModelCatalog: Partial<Record<LLMProvider, ProviderModelsDefinition>>;
  providerModelsLoading: boolean;
  currentProviderModel: string;
  currentProviderEffort: string;
  selectProviderModel: (provider: LLMProvider, model: string, sessionId?: string | null) => Promise<unknown>;
  selectProviderEffort: (provider: LLMProvider, effort: string, sessionId?: string | null) => Promise<unknown>;
  currentSessionId: string | null;
  isProcessing: boolean;
  /** The composer's "fill and submit" entry point: sends through the normal pipeline (uploads, session gateway, websocket). */
  handleVoiceTranscript: (text: string, send?: boolean) => void;
  handleAbortSession: () => void;
  setAttachedFiles: (files: File[]) => void;
  onNewSession?: () => void;
  /** The project's conversations (Astranote's history list) and the way to open one in this frame. */
  sessions?: readonly ProjectSession[];
  openSession?: (sessionId: string) => void;
};

type Pending = { content: string; files: File[]; options: EmbedModelOptions; timer: number | null };

/** How long a send waits for a requested model to become the composer's model before going out regardless. */
const SETTLE_MS = 1500;

const matches = (options: EmbedModelOptions, a: UseEmbedBridgeArgs): boolean =>
  (!options.provider || options.provider === a.provider)
  && (!options.model || options.model === a.currentProviderModel)
  && (!options.effort || options.effort === a.currentProviderEffort);

/**
 * Used by ChatInterface in embed mode: the Astranote parent drives this frame through
 * `astra:*` postMessages (send / abort / new / model / transcribe) and hears back the model
 * catalogue, the session id, the streaming state and voice transcripts. A send that names a
 * model the composer is not on yet is parked until the provider state reports that model
 * (or SETTLE_MS pass), so the turn goes out under the model the user picked.
 */
export function useEmbedBridge(args: UseEmbedBridgeArgs): void {
  const { enabled: on, parentOrigin, sessions, providerModelsLoading, providerModelCatalog, provider, currentProviderModel, currentProviderEffort, currentSessionId, isProcessing } = args;
  const enabled = on && parentOrigin !== '';
  const latest = useRef(args);
  latest.current = args;
  const pending = useRef<Pending | null>(null);

  const post = useCallback((message: unknown) => {
    if (typeof window === 'undefined' || !window.parent) return;
    if (!parentOrigin) return;
    window.parent.postMessage(message, parentOrigin);
  }, [parentOrigin]);

  useEffect(() => {
    if (!enabled || providerModelsLoading) return;
    post(buildReadyMessage(providerModelCatalog, provider, currentProviderModel, currentProviderEffort));
  }, [enabled, providerModelsLoading, providerModelCatalog, provider, currentProviderModel, currentProviderEffort, post]);

  useEffect(() => {
    if (enabled) post({ type: EMBED.session, sessionId: currentSessionId ?? null });
  }, [enabled, currentSessionId, post]);

  useEffect(() => {
    if (enabled) post({ type: EMBED.state, streaming: isProcessing });
  }, [enabled, isProcessing, post]);

  useEffect(() => {
    if (enabled) post(buildSessionsMessage(sessions));
  }, [enabled, sessions, post]);

  const flush = useCallback((force = false) => {
    const p = pending.current;
    if (!p) return;
    const a = latest.current;
    if (!force && !matches(p.options, a)) return;
    pending.current = null;
    if (p.timer !== null) window.clearTimeout(p.timer);
    if (p.files.length) a.setAttachedFiles(p.files);
    a.handleVoiceTranscript(p.content, true);
  }, []);

  // The parked send goes out on the render where the composer reports the requested model.
  useEffect(() => { flush(); }, [provider, currentProviderModel, currentProviderEffort, flush]);

  const applyOptions = useCallback(async (options: EmbedModelOptions) => {
    const a = latest.current;
    if (options.provider && options.provider !== a.provider) {
      a.setProvider(options.provider);
      writeSelectedProvider(options.provider);
    }
    const target = options.provider ?? a.provider;
    if (options.model && (options.model !== a.currentProviderModel || target !== a.provider)) {
      await a.selectProviderModel(target, options.model, a.currentSessionId);
    }
    if (options.effort && (options.effort !== a.currentProviderEffort || target !== a.provider)) {
      await a.selectProviderEffort(target, options.effort, a.currentSessionId);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const handle = async (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== parentOrigin) return;
      const command = parseEmbedCommand(event.data);
      if (!command) return;
      switch (command.type) {
        case 'send': {
          if (pending.current) flush(true);   // a second send before the first settled: the first goes out now, never dropped

          pending.current = { content: command.content, files: command.files, options: command.options, timer: null };
          // Already on the requested model: out it goes, synchronously.
          if (matches(command.options, latest.current)) { flush(); break; }
          pending.current.timer = window.setTimeout(() => flush(true), SETTLE_MS);
          try { await applyOptions(command.options); } catch (error) { console.error('Embed: model selection failed', error); }
          flush();
          break;
        }
        case 'abort':
          latest.current.handleAbortSession();
          break;
        case 'new':
          latest.current.onNewSession?.();
          break;
        case 'sessions':
          post(buildSessionsMessage(latest.current.sessions));
          break;
        case 'open':
          latest.current.openSession?.(command.sessionId);
          break;
        case 'model':
          try { await applyOptions(command.options); } catch (error) { console.error('Embed: model selection failed', error); }
          break;
        case 'transcribe': {
          try {
            const response = await transcribeVoice(command.blob, command.name);
            if (!response.ok) throw new Error(`transcribe ${response.status}`);
            const data = await response.json();
            post({ type: EMBED.transcript, text: String(data?.text || '').trim() });
          } catch (error) {
            post({ type: EMBED.error, message: error instanceof Error ? error.message : String(error) });
          }
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener('message', handle);
    return () => {
      window.removeEventListener('message', handle);
      if (pending.current?.timer) window.clearTimeout(pending.current.timer);
    };
  }, [enabled, parentOrigin, applyOptions, flush, post]);
}
