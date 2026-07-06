// ---------------------------------------------------------------------------
// assistant.types.ts
// Strict TypeScript types for the Groq Chat Completions REST API and the
// internal assistant domain.  No `any` types — every shape is explicit.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Groq REST API — Request / Response shapes
// (mirrors the OpenAI-compatible Chat Completions v1 contract)
// ---------------------------------------------------------------------------

/** Valid sender roles for a Groq chat message. */
export type GroqRole = 'system' | 'user' | 'assistant';

/** A single message in a Groq chat conversation. */
export interface GroqMessage {
  role: GroqRole;
  content: string;
}

/** Body sent to POST /openai/v1/chat/completions. */
export interface GroqChatCompletionRequest {
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  /** When true the endpoint streams Server-Sent Events.  Currently kept false;
   *  the architecture is stream-ready — swap the fetch handler to consume an
   *  SSE ReadableStream when you are ready to ship streaming. */
  stream: false;
  /** Optional stop sequences. */
  stop?: string | string[];
}

/** A single completion choice returned by the Groq API. */
export interface GroqChatChoice {
  index: number;
  message: GroqMessage;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  logprobs: null;
}

/** Token usage statistics from the Groq response. */
export interface GroqUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_time?: number;
  completion_time?: number;
  total_time?: number;
}

/** Top-level response from POST /openai/v1/chat/completions (stream: false). */
export interface GroqChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: GroqChatChoice[];
  usage: GroqUsage;
  system_fingerprint?: string | null;
}

/** Shape of a Groq error body. */
export interface GroqApiErrorBody {
  error: {
    message: string;
    type: string;
    code: string | null;
  };
}

// ---------------------------------------------------------------------------
// Internal domain types
// ---------------------------------------------------------------------------

/** Reason why the Groq API call failed. */
export type GroqErrorKind =
  | 'missing_api_key'   // Key not present in env
  | 'rate_limited'      // HTTP 429
  | 'server_error'      // HTTP 5xx
  | 'client_error'      // HTTP 4xx (non-429)
  | 'timeout'           // AbortController fired
  | 'network_error'     // fetch() threw
  | 'parse_error';      // Response JSON malformed

/** Structured error produced by the Groq service layer. */
export interface GroqServiceError {
  kind: GroqErrorKind;
  message: string;
  statusCode?: number;
  retryAfterMs?: number;
}

/** Successful result from chatCompletion(). */
export interface ChatResponse {
  message: string;
  conversationId: string;
  /** Whether the response came from the live Groq API (true) or the fallback path (false). */
  fromApi: boolean;
  usage?: GroqUsage;
}

/** A single history item returned by getHistory(). */
export interface HistoryItem {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

/** Retry configuration for fetchWithRetry. */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}
