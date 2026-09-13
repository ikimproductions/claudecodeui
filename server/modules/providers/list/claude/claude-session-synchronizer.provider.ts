import path from 'node:path';
import { readFile } from 'node:fs/promises';

import { sessionsDb } from '@/modules/database/index.js';
import {
  buildLookupMap,
  extractFirstValidJsonlData,
  findFilesRecursivelyCreatedAfter,
  normalizeSessionName,
  readFileTimestamps,
} from '@/shared/utils.js';
import type { IProviderSessionSynchronizer } from '@/shared/interfaces.js';
import { claudeHome as resolveClaudeHome } from '@/shared/claude-home.js';
import { pickSessionName, UNTITLED_CLAUDE_SESSION } from '@/modules/providers/list/claude/session-title.js';

type TranscriptTitles = { aiTitles: string[]; customTitle?: string; lastPrompt?: string; firstPrompt?: string };

type ParsedSession = {
  sessionId: string;
  projectPath: string;
  sessionName?: string;
};

/**
 * Session indexer for Claude transcript artifacts.
 */
export class ClaudeSessionSynchronizer implements IProviderSessionSynchronizer {
  private readonly provider = 'claude' as const;
  private readonly claudeHome = resolveClaudeHome();

  /**
   * Returns true when a JSONL file is a subagent transcript or tool result
   * rather than a top-level session.
   *
   * Claude stores subagent transcripts under a `subagents/` directory and
   * tool results under a `tool-results/` directory, e.g.
   * `~/.claude/projects/<encoded-cwd>/<session-id>/subagents/agent-<id>.jsonl`.
   * Those files repeat the parent session's `sessionId`, so indexing them as
   * standalone sessions overwrites the parent row's `jsonl_path` and corrupts
   * the main session record. The recursive scan in `synchronize()` reaches
   * them, so both entry points must skip them.
   */
  private isSubagentTranscript(filePath: string): boolean {
    const pathParts = path.normalize(filePath).split(path.sep);
    return pathParts.includes('subagents') || pathParts.includes('tool-results');
  }

  /**
   * Scans ~/.claude/projects and upserts discovered sessions into DB.
   */
  async synchronize(since?: Date): Promise<number> {
    const nameMap = await buildLookupMap(path.join(this.claudeHome, 'history.jsonl'), 'sessionId', 'display');
    const files = await findFilesRecursivelyCreatedAfter(
      path.join(this.claudeHome, 'projects'),
      '.jsonl',
      since ?? null
    );

    let processed = 0;
    for (const filePath of files) {
      if (this.isSubagentTranscript(filePath)) {
        continue;
      }

      const parsed = await this.processSessionFile(filePath, nameMap);
      if (!parsed) {
        continue;
      }

      const timestamps = await readFileTimestamps(filePath);
      sessionsDb.createSession(
        parsed.sessionId,
        this.provider,
        parsed.projectPath,
        parsed.sessionName,
        timestamps.createdAt,
        timestamps.updatedAt,
        filePath,
        { replaceName: true }
      );
      processed += 1;
    }

    return processed;
  }

  /**
   * Parses and upserts one Claude session JSONL file.
   */
  async synchronizeFile(filePath: string): Promise<string | null> {
    if (!filePath.endsWith('.jsonl')) {
      return null;
    }
    if (this.isSubagentTranscript(filePath)) {
      return null;
    }

    const nameMap = await buildLookupMap(path.join(this.claudeHome, 'history.jsonl'), 'sessionId', 'display');
    const parsed = await this.processSessionFile(filePath, nameMap);
    if (!parsed) {
      return null;
    }

    const timestamps = await readFileTimestamps(filePath);
    return sessionsDb.createSession(
      parsed.sessionId,
      this.provider,
      parsed.projectPath,
      parsed.sessionName,
      timestamps.createdAt,
      timestamps.updatedAt,
      filePath,
      { replaceName: true }
    );
  }

  /**
   * Extracts session metadata from one Claude JSONL session file.
   */
  private async processSessionFile(
    filePath: string,
    nameMap: Map<string, string>
  ): Promise<ParsedSession | null> {
    const parsed = await extractFirstValidJsonlData(filePath, (rawData) => {
      const data = rawData as Record<string, unknown>;
      const sessionId = typeof data.sessionId === 'string' ? data.sessionId : undefined;
      const projectPath = typeof data.cwd === 'string' ? data.cwd : undefined;

      if (!sessionId || !projectPath) {
        return null;
      }

      return {
        sessionId,
        projectPath,
      };
    });

    if (!parsed) {
      return null;
    }

    // App-created sessions are keyed by an app id, so disk-discovered provider
    // ids must be resolved through the provider-id mapping first. The title
    // Claude Code wrote into the transcript replaces a derived name (the first
    // words of the first prompt); a name the user typed is kept.
    const existingSession = sessionsDb.getSessionByProviderSessionId(parsed.sessionId)
      ?? sessionsDb.getSessionById(parsed.sessionId);
    const titles = await this.readTranscriptTitles(filePath, parsed.sessionId);
    const sessionName = pickSessionName({
      existing: existingSession?.custom_name,
      historyDisplay: nameMap.get(parsed.sessionId),
      ...titles,
    });

    return {
      ...parsed,
      sessionName: normalizeSessionName(sessionName, UNTITLED_CLAUDE_SESSION),
    };
  }

  /** Collects every title row Claude Code wrote into one transcript (see session-title.ts). */
  private async readTranscriptTitles(filePath: string, sessionId: string): Promise<TranscriptTitles> {
    const titles: TranscriptTitles = { aiTitles: [] };
    try {
      const content = await readFile(filePath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || !line.includes('"sessionId"')) {
          continue;
        }
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(line) as Record<string, unknown>;
        } catch {
          continue;
        }
        if (data.sessionId !== sessionId || typeof data.type !== 'string') {
          continue;
        }
        if (data.type === 'user' && !titles.firstPrompt) {
          const content = (data.message as { content?: unknown } | undefined)?.content;
          const text = typeof content === 'string' ? content : Array.isArray(content) ? content.find((part) => part?.type === 'text')?.text : undefined;
          if (typeof text === 'string' && text.trim() && !text.trimStart().startsWith('<')) titles.firstPrompt = text;
        }
        if (data.type === 'ai-title' && typeof data.aiTitle === 'string' && data.aiTitle.trim()) {
          titles.aiTitles.push(data.aiTitle);
        } else if (data.type === 'custom-title' && typeof data.customTitle === 'string' && data.customTitle.trim()) {
          titles.customTitle = data.customTitle;
        } else if (data.type === 'last-prompt' && typeof data.lastPrompt === 'string' && data.lastPrompt.trim()) {
          titles.lastPrompt = data.lastPrompt;
        }
      }
    } catch {
      // Ignore missing/unreadable files so sync can continue.
    }
    return titles;
  }
}
