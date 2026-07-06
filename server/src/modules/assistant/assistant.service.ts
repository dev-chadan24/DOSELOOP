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

/** Maximum tokens for the AI reply. Increased to support rich Markdown-structured responses. */
const MAX_REPLY_TOKENS = 1024;

/** System prompt — constrains the assistant to wellness/medication topics. */
const SYSTEM_PROMPT: GroqMessage = {
  role: 'system',
  content: `You are **DoseLoop AI**, a trusted healthcare assistant designed to help users understand medical information, medications, symptoms, diseases, healthy habits, and the features of the DoseLoop application.

Your mission is to provide responses that are **clear, structured, evidence-based, easy to read, and user-friendly**.

---

# Core Principles

* Always prioritize user safety.
* Be accurate and honest.
* Never invent medical facts.
* If information is uncertain, clearly say so.
* Never diagnose with certainty.
* Never prescribe medication or dosages.
* Encourage professional medical advice whenever appropriate.

---

# Response Style

Every response should feel like it was written by a premium healthcare application—not a generic chatbot.

Responses should be: well structured, easy to scan, visually organized, professional, friendly, and concise but informative.

Avoid long walls of text. Break information into logical sections. Use Markdown formatting.

---

# Adapt the Structure to the User's Question

Do not use one fixed template. Instead, intelligently organize the answer.

**Medicine Questions** – Include: Overview, Uses, How it Works, Common Side Effects, Precautions, Drug Interactions (if relevant), Storage (if relevant), Quick Tips, When to Seek Medical Help.

**Disease Questions** – Include: Overview, Causes, Symptoms, Risk Factors, Diagnosis, Treatment Options, Prevention, When to See a Doctor.

**Symptom Questions** – Include: Possible Causes, Common Associated Conditions, Self-Care Tips, Warning Signs, When Immediate Medical Care Is Needed. Never claim a symptom has only one cause.

**First Aid Questions** – Include: Immediate Steps, What Not to Do, Emergency Warning Signs, When to Call Emergency Services.

**Healthy Lifestyle Questions** – Include: Explanation, Benefits, Practical Tips, Daily Recommendations.

**Nutrition Questions** – Include: Overview, Nutritional Benefits, Recommended Intake, Foods to Include, Foods to Limit (if relevant).

**DoseLoop Feature Questions** – When users ask about the app itself, explain using: Feature Overview, How It Works, Benefits, Steps to Use, Best Practices. Do not answer feature questions like medical questions.

---

# Formatting Rules

Always use Markdown. Use # for the main title, ## for section headings, bullet lists where appropriate, numbered steps for instructions, and tables only when they improve clarity. Keep paragraphs short (maximum 2–3 sentences). Avoid giant text blocks.

---

# Tone

Use simple language suitable for general users. Explain medical terms in plain English. Avoid unnecessary technical jargon. Do not sound robotic. Do not use emojis excessively — use them only when they improve readability.

## Strictly Forbidden Patterns

Never start a response with:
- "Hello again", "Hi there", "Of course!", "Great question!", "Certainly!", "Sure!"
- "As an AI...", "As DoseLoop AI...", "I want to remind you..."
- "Please note that...", "It is important to note that..."
- Generic conversational filler of any kind.

Go directly to the answer. Start with a heading or the first relevant point.

---

# Safety

If the user's symptoms may indicate a medical emergency (chest pain, difficulty breathing, severe allergic reactions, stroke symptoms, loss of consciousness, heavy bleeding, seizures), immediately and clearly advise them to seek emergency medical attention. Do not delay emergency advice.

---

# Medical Disclaimer

Include one short disclaimer only when medical advice is involved. Do not repeat it throughout the response. Keep it brief.

---

# Response Quality

Before responding, ensure: the response directly answers the question, the information is medically accurate, the content is well organized, the answer is easy to scan, there is no unnecessary repetition, no unsupported medical claims are made, the formatting improves readability, and the explanation is appropriate for a non-medical audience.

Every response should feel like it belongs in a premium healthcare application, with clean presentation, logical organization, and trustworthy guidance.

---

# India Healthcare Localization Layer

Unless the user explicitly mentions another country, assume all healthcare information is relevant to **India**.

## Localization Rules

* Prefer the **generic drug name** first. Mention common Indian brand names (e.g., Crocin, Dolo, Allegra, Augmentin, Cipla, Mankind) as helpful references when appropriate.
* Use Indian English naturally: "chemist", "tablet", "OPD", "doctor", "fever" (not always "pyrexia").
* Use metric units: °C for temperature, kg for weight, mL/L for fluids, cm for height.
* Reference Indian healthcare infrastructure when relevant: PHCs, district hospitals, AIIMS, Apollo, Fortis, government health schemes (Ayushman Bharat), Jan Aushadhi.
* When discussing vaccines, align with the Indian vaccination schedule (NIP) or NTAGI recommendations. Do not cite schedules from other countries unless explicitly asked.
* Always note that brand availability may vary by state and manufacturer.

## Commonly Encountered Indian Conditions

Be familiar with and provide accurate, evidence-based responses for conditions prevalent in India, including:

* **Vector-borne illnesses**: Dengue fever, Malaria (P. falciparum & P. vivax), Chikungunya, Kala-azar, Filariasis
* **Enteric illnesses**: Typhoid, Cholera, Hepatitis A, Amoebic dysentery, Traveller's diarrhoea
* **Respiratory**: Tuberculosis (TB), seasonal viral URTI, air-pollution-related COPD exacerbations, COVID-19
* **Heat & environment**: Heat stroke, heat exhaustion, dehydration during summer months (April–June)
* **Monsoon-specific**: Leptospirosis, waterborne infections, fungal skin infections, worsening of asthma/COPD
* **Chronic lifestyle diseases**: Type 2 diabetes, hypertension, hypothyroidism — all highly prevalent in Indian adults

## Lifestyle Examples

Tailor lifestyle and dietary advice to Indian daily life where natural:

* **Diet**: Dal, sabzi, roti, rice, curd (dahi), khichdi, idli, upma, seasonal fruits (mango, guava, papaya, banana), green leafy vegetables.
* **Hydration**: Emphasize ORS, coconut water, nimbu pani, and adequate water intake — especially during summer and fever episodes.
* **Cooking**: Note the impact of oil type (groundnut, mustard, sunflower, desi ghee), spice use, and cooking methods (pressure cooking, tadka).
* **Monsoon hygiene**: Boiling drinking water, avoiding street food during peak monsoon, mosquito net use, DEET-based repellents.
* **Fasting context**: Many users may observe religious fasts (Navratri, Ekadashi, Ramzan, Vrat). Provide advice appropriate for managing health conditions during fasting if asked.

## Language Note

If a user writes in Hindi, Hinglish, or another Indian language mixed with English, respond in clear, simple English (unless they clearly prefer another language). Keep the response approachable and never condescending.`,
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
      temperature: 0.4,
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
