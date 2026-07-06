// ---------------------------------------------------------------------------
// assistant.service.ts
// Production-ready Groq AI service for the DoseLoop assistant module.
//
// Design principles enforced here:
//  • Zero `any` types — every shape is imported from assistant.types.ts.
//  • API key is read from env.GROQ_API_KEY (validated by env.ts via Zod).
//  • Missing key → graceful fallback; server never crashes.
//  • Retry with exponential back-off for transient failures (429 / 5xx / timeout).
//  • Conversation persistence via Prisma (AssistantConversation / AssistantMessage).
//  • Streaming-ready architecture: stream is set to `false` now; swapping the
//    fetch handler to consume SSE is the only change needed to enable streaming.
//  • Rate-limiting preparation: retryAfterMs is parsed from Retry-After headers.
// ---------------------------------------------------------------------------

import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import type {
  GroqMessage,
  GroqChatCompletionRequest,
  GroqChatCompletionResponse,
  GroqApiErrorBody,
  GroqServiceError,
  GroqErrorKind,
  ChatResponse,
  HistoryItem,
  RetryConfig,
} from './assistant.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions' as const;

/**
 * Model selection.
 * llama-3.3-70b-versatile is Groq's highest-quality generally available model.
 * Swap to a smaller model (llama3-8b-8192) if you need lower latency or cost.
 */
const MODEL = 'llama-3.3-70b-versatile' as const;

/** Hard timeout per individual HTTP request attempt (ms). */
const REQUEST_TIMEOUT_MS = 15_000;

/** Maximum number of recent messages to include as context (controls token cost). */
const HISTORY_CONTEXT_LIMIT = 12;

/** Maximum tokens for the AI reply. */
const MAX_REPLY_TOKENS = 512;

/** System prompt — constrains the assistant to wellness/medication topics. */
const SYSTEM_PROMPT: GroqMessage = {
  role: 'system',
  content:
    'You are the DoseLoop AI assistant — a helpful, empathetic health companion. ' +
    'You support users with medication adherence, wellness tracking, and healthy habits. ' +
    'Always be concise and clear. ' +
    'You must not diagnose medical conditions, prescribe treatments, or replace professional ' +
    'medical advice. If asked about a medical diagnosis or prescription, politely clarify that ' +
    'you are an AI assistant and recommend they consult a qualified healthcare professional. ' +
    'Clearly label any AI-generated suggestions as AI-generated.',
};

/** Fallback reply when the API key is absent or unrecoverable errors occur. */
const FALLBACK_MESSAGES = {
  missingKey:
    "I'm currently offline — the DoseLoop AI key hasn't been configured yet. " +
    'A system administrator just needs to add the GROQ_API_KEY to the server environment to wake me up!',
  serviceError:
    "I'm having trouble connecting to my AI service right now. " +
    'Please try again in a moment. If this keeps happening, contact support.',
} as const;

/** Default retry policy. */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1_000,
  maxDelayMs: 10_000,
  backoffFactor: 2,
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Returns a promise that resolves after `ms` milliseconds. */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Calculates the next back-off delay, capped at maxDelayMs. */
function calcBackoff(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt - 1);
  return Math.min(delay, config.maxDelayMs);
}

/** Parses the Retry-After header (seconds integer or HTTP-date) into milliseconds. */
function parseRetryAfterMs(retryAfterHeader: string | null): number | undefined {
  if (!retryAfterHeader) return undefined;
  const seconds = parseInt(retryAfterHeader, 10);
  if (!isNaN(seconds)) return seconds * 1_000;
  const date = Date.parse(retryAfterHeader);
  if (!isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
}

/** Type-guard: checks whether a fetch error is due to an AbortSignal timeout. */
function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}

/** Determines whether an HTTP status code warrants a retry. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

// ---------------------------------------------------------------------------
// Core Groq API fetch — with retry & timeout
// ---------------------------------------------------------------------------

/**
 * Sends a chat completion request to the Groq REST API.
 *
 * @returns The parsed Groq response, or null when the API key is absent.
 * @throws  {GroqServiceError} on exhausted retries or non-retryable errors.
 */
async function fetchChatCompletion(
  requestBody: GroqChatCompletionRequest,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<GroqChatCompletionResponse | null> {
  const apiKey = env.GROQ_API_KEY;

  if (!apiKey) {
    logger.warn(
      '[assistant] GROQ_API_KEY is not configured — returning fallback response. ' +
        'Set GROQ_API_KEY in server/.env to enable the AI assistant.',
    );
    return null;
  }

  let lastError: GroqServiceError | null = null;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-DoseLoop-Version': '1.0',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // ── Success ────────────────────────────────────────────────────────────
      if (response.ok) {
        const json: unknown = await response.json();
        // Runtime shape validation — ensures the response matches our type.
        if (
          typeof json === 'object' &&
          json !== null &&
          'choices' in json &&
          Array.isArray((json as GroqChatCompletionResponse).choices)
        ) {
          return json as GroqChatCompletionResponse;
        }

        const parseErr: GroqServiceError = {
          kind: 'parse_error',
          message: 'Groq API returned an unexpected response shape.',
        };
        logger.error('[assistant] Groq response parse error', { body: JSON.stringify(json) });
        throw parseErr;
      }

      // ── Error response ─────────────────────────────────────────────────────
      const rawText = await response.text();
      let apiErrorMessage = rawText;

      try {
        const parsed: GroqApiErrorBody = JSON.parse(rawText) as GroqApiErrorBody;
        apiErrorMessage = parsed.error?.message ?? rawText;
      } catch {
        // rawText is not JSON — use as-is
      }

      const retryAfterMs = parseRetryAfterMs(response.headers.get('Retry-After'));
      const shouldRetry = isRetryableStatus(response.status);

      const kind: GroqErrorKind =
        response.status === 429 ? 'rate_limited' : response.status >= 500 ? 'server_error' : 'client_error';

      lastError = {
        kind,
        message: `Groq API error ${response.status}: ${apiErrorMessage}`,
        statusCode: response.status,
        retryAfterMs,
      };

      if (!shouldRetry) {
        // Non-retryable (4xx other than 429) — throw immediately.
        logger.error(`[assistant] Non-retryable Groq error on attempt ${attempt}`, lastError);
        throw lastError;
      }

      logger.warn(`[assistant] Retryable Groq error on attempt ${attempt}/${retryConfig.maxAttempts}`, lastError);

      if (attempt < retryConfig.maxAttempts) {
        const delay = retryAfterMs ?? calcBackoff(attempt, retryConfig);
        logger.info(`[assistant] Waiting ${delay}ms before retry ${attempt + 1}...`);
        await sleep(delay);
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      // Already a GroqServiceError — rethrow without wrapping.
      if (
        typeof err === 'object' &&
        err !== null &&
        'kind' in err &&
        'message' in err
      ) {
        throw err as GroqServiceError;
      }

      if (isAbortError(err)) {
        lastError = {
          kind: 'timeout',
          message: `Groq request timed out after ${REQUEST_TIMEOUT_MS}ms on attempt ${attempt}.`,
        };
        logger.warn(`[assistant] Request timeout on attempt ${attempt}/${retryConfig.maxAttempts}`, lastError);
      } else {
        lastError = {
          kind: 'network_error',
          message: err instanceof Error ? err.message : 'Unknown network error communicating with Groq.',
        };
        logger.warn(`[assistant] Network error on attempt ${attempt}/${retryConfig.maxAttempts}`, lastError);
      }

      if (attempt < retryConfig.maxAttempts) {
        const delay = calcBackoff(attempt, retryConfig);
        logger.info(`[assistant] Waiting ${delay}ms before retry ${attempt + 1}...`);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted.
  logger.error('[assistant] All Groq retry attempts exhausted.', lastError ?? {});
  throw lastError ?? { kind: 'network_error', message: 'All Groq retry attempts exhausted.' };
}

// ---------------------------------------------------------------------------
// Public service functions
// ---------------------------------------------------------------------------

/**
 * Sends a user message, persists it, calls Groq, persists the reply, and
 * returns the structured ChatResponse.
 *
 * If the API key is absent the function returns the fallback message rather
 * than throwing — the server stays up and the user gets a helpful explanation.
 */
export const chatCompletion = async (userId: string, message: string): Promise<ChatResponse> => {
  // ── 1. Resolve or create conversation ────────────────────────────────────
  let conversation = await prisma.assistantConversation.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }, // use the most recent conversation
  });

  if (!conversation) {
    conversation = await prisma.assistantConversation.create({
      data: { userId },
    });
    logger.info(`[assistant] Created new conversation ${conversation.id} for user ${userId}`);
  }

  // ── 2. Persist the incoming user message ─────────────────────────────────
  await prisma.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'USER',
      content: message,
    },
  });

  // ── 3. Build conversation context (most recent N messages) ───────────────
  const recentMessages = await prisma.assistantMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_CONTEXT_LIMIT,
    select: { role: true, content: true },
  });

  const contextMessages: GroqMessage[] = [
    SYSTEM_PROMPT,
    // Reverse so messages are chronological (oldest → newest)
    ...recentMessages.reverse().map(
      (msg): GroqMessage => ({
        role: msg.role === 'USER' ? 'user' : 'assistant',
        content: msg.content,
      }),
    ),
  ];

  // ── 4. Call Groq (with retry/fallback) ───────────────────────────────────
  let replyText = FALLBACK_MESSAGES.missingKey;
  let fromApi = false;
  let usage: GroqChatCompletionResponse['usage'] | undefined;

  try {
    const groqResponse = await fetchChatCompletion({
      model: MODEL,
      messages: contextMessages,
      temperature: 0.7,
      max_tokens: MAX_REPLY_TOKENS,
      top_p: 0.9,
      stream: false,
    });

    if (groqResponse && groqResponse.choices.length > 0) {
      const choice = groqResponse.choices[0];
      replyText = choice.message.content;
      fromApi = true;
      usage = groqResponse.usage;

      logger.info('[assistant] Groq chat completion succeeded', {
        conversationId: conversation.id,
        model: groqResponse.model,
        finishReason: choice.finish_reason,
        totalTokens: groqResponse.usage?.total_tokens,
      });
    } else if (groqResponse === null) {
      // Key is missing — already logged by fetchChatCompletion.
      replyText = FALLBACK_MESSAGES.missingKey;
      fromApi = false;
    }
  } catch (err: unknown) {
    fromApi = false;

    if (
      typeof err === 'object' &&
      err !== null &&
      'kind' in err
    ) {
      const svcErr = err as GroqServiceError;
      logger.error(`[assistant] Groq service error (${svcErr.kind}): ${svcErr.message}`, {
        conversationId: conversation.id,
        kind: svcErr.kind,
        statusCode: svcErr.statusCode,
      });
    } else {
      logger.error('[assistant] Unexpected error during Groq chat completion', {
        conversationId: conversation.id,
        err: err instanceof Error ? err.message : String(err),
      });
    }

    replyText = FALLBACK_MESSAGES.serviceError;
  }

  // ── 5. Persist the assistant reply ───────────────────────────────────────
  await prisma.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'ASSISTANT',
      content: replyText,
    },
  });

  return {
    message: replyText,
    conversationId: conversation.id,
    fromApi,
    usage,
  };
};

/**
 * Returns the full chronological message history for a user's most recent
 * conversation, or an empty array if no conversation exists yet.
 */
export const getHistory = async (userId: string): Promise<HistoryItem[]> => {
  const conversation = await prisma.assistantConversation.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (!conversation) return [];

  const messages = await prisma.assistantMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true, createdAt: true },
  });

  return messages.map((msg): HistoryItem => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  }));
};

/**
 * Creates a brand-new conversation for the user, ending the previous session.
 * Future messages will be attached to this new conversation.
 */
export const startNewConversation = async (userId: string): Promise<string> => {
  const conversation = await prisma.assistantConversation.create({
    data: { userId },
  });

  logger.info(`[assistant] Started new conversation ${conversation.id} for user ${userId}`);
  return conversation.id;
};

/**
 * Deletes all conversation history for the given user.
 * This is a hard delete — used for privacy / account-deletion flows.
 */
export const clearHistory = async (userId: string): Promise<void> => {
  const conversations = await prisma.assistantConversation.findMany({
    where: { userId },
    select: { id: true },
  });

  if (conversations.length === 0) return;

  const ids = conversations.map((c) => c.id);

  await prisma.assistantMessage.deleteMany({
    where: { conversationId: { in: ids } },
  });

  await prisma.assistantConversation.deleteMany({
    where: { userId },
  });

  logger.info(`[assistant] Cleared ${ids.length} conversation(s) for user ${userId}`);
};
