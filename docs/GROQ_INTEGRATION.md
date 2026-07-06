# Groq AI Integration Guide

> Cross-references: `ARCHITECTURE.md §9` for the AI integration design, `DEVELOPMENT.md §5` for environment variable standards.

## Overview

DoseLoop uses [Groq](https://groq.com) as its LLM inference provider for the AI assistant feature.  Groq's low-latency inference engine meets the `<1.5 s` AI response budget defined in `DEVELOPMENT.md §9`.

The integration is implemented in `server/src/modules/assistant/` and uses the **official Groq REST API** via native `fetch` — no third-party SDK dependency is required.

---

## Quick Start: Adding Your API Key

The **only thing you need to do** to activate the AI assistant is:

1. Open `server/.env` (create it from `server/.env.example` if it doesn't exist).
2. Find the line:
   ```
   GROQ_API_KEY=gsk_your_groq_api_key_here
   ```
3. Replace the placeholder with your real key:
   ```
   GROQ_API_KEY=gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
4. Restart the server (`npm run dev`).

### Where to get a key

1. Sign in to [https://console.groq.com/keys](https://console.groq.com/keys)
2. Click **Create API Key**
3. Copy the generated key — it will start with `gsk_`

> **Never commit your real API key.** `server/.env` is already in `.gitignore`. Only `server/.env.example` (which contains the placeholder, not a real key) is committed to version control.

---

## Architecture

```
client  →  POST /api/v1/ai/chat
              │
              ▼
         assistant.routes.ts   (auth middleware + rate limiter + Zod validation)
              │
              ▼
         assistant.controller.ts   (request/response shaping only)
              │
              ▼
         assistant.service.ts   (business logic, Groq fetch, persistence)
              │
         ┌────┴────┐
         ▼         ▼
      Groq API   Prisma (PostgreSQL)
   (llm inference) (conversation store)
```

### Files

| File | Responsibility |
|------|----------------|
| `assistant.types.ts` | Strict TypeScript types for Groq REST API and internal domain |
| `assistant.service.ts` | Groq API calls, retry logic, conversation persistence |
| `assistant.controller.ts` | Thin HTTP handlers — request/response only, no business logic |
| `assistant.routes.ts` | Express router, auth, rate limiter, Zod body validation |

---

## Endpoints

All endpoints require a valid `Authorization: Bearer <token>` header.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/ai/chat` | Send a message; returns the AI reply |
| `GET` | `/api/v1/ai/history` | Fetch full conversation history |
| `POST` | `/api/v1/ai/conversation/new` | Start a fresh conversation |
| `DELETE` | `/api/v1/ai/history` | Permanently delete all history |

### POST `/api/v1/ai/chat`

**Request body:**
```json
{
  "message": "What time should I take my blood pressure medication?"
}
```

**Success response (`200`):**
```json
{
  "success": true,
  "data": {
    "message": "...",
    "conversationId": "uuid",
    "fromApi": true,
    "usage": {
      "prompt_tokens": 120,
      "completion_tokens": 87,
      "total_tokens": 207
    }
  }
}
```

**Fallback response when key is missing (`200`):**
```json
{
  "success": true,
  "data": {
    "message": "I'm currently offline — the DoseLoop AI key hasn't been configured yet...",
    "conversationId": "uuid",
    "fromApi": false
  }
}
```

> The `fromApi: false` flag lets the frontend distinguish a real AI reply from a fallback, so it can display an appropriate UI indicator.

---

## Environment Variables

Defined in `server/src/config/env.ts` and validated by **Zod** at startup.

| Variable | Required | Format | Notes |
|----------|----------|--------|-------|
| `GROQ_API_KEY` | No (graceful fallback) | `gsk_...` | If absent the server stays up; assistant returns fallback |

### Validation rules

- Must start with `gsk_`
- The literal placeholder string `gsk_your_groq_api_key_here` is rejected with a clear warning
- If absent: a `console.warn` is emitted at startup — **the server does NOT exit**

---

## Behaviour Without an API Key

The server is designed to **never crash** due to a missing Groq key:

1. `env.ts` emits a startup warning and continues.
2. `assistant.service.ts` detects the absent key and returns `null` from `fetchChatCompletion`.
3. The service returns the fallback message string instead of throwing.
4. The user receives a friendly explanation in the `message` field.
5. The exchange is still persisted to the database for auditing.

---

## Model

Currently configured to `llama-3.3-70b-versatile` — Groq's highest-quality generally available model.  To switch models, update the `MODEL` constant in `assistant.service.ts`:

```typescript
const MODEL = 'llama-3.3-70b-versatile' as const;
// Alternatives: 'llama3-8b-8192' (faster/cheaper), 'mixtral-8x7b-32768'
```

---

## Retry & Timeout Policy

| Setting | Value |
|---------|-------|
| Request timeout | 15 seconds (per attempt) |
| Max retry attempts | 3 |
| Initial back-off delay | 1 second |
| Back-off factor | 2× (exponential) |
| Max back-off delay | 10 seconds |
| Retryable HTTP statuses | `429`, `5xx` |
| Retry-After header | Respected when present |

---

## Rate Limiting

A dedicated `express-rate-limit` instance is applied to all AI routes:

- **20 requests per IP per minute** (write/POST endpoints only)
- `GET` endpoints (history) are exempt
- Returns a structured `{ success: false, error: { message } }` response on breach
- **Redis-ready:** swap the default in-memory store for `rate-limit-redis` when scaling to multiple instances

---

## Streaming

The architecture is **streaming-ready**. The `stream` field is currently set to `false`.  To enable streaming:

1. Change `stream: false` → `stream: true` in the `fetchChatCompletion` call in `assistant.service.ts`.
2. Replace the `await response.json()` block with an SSE `ReadableStream` consumer.
3. Update the controller to pipe the stream to the Express response with `Content-Type: text/event-stream`.

No structural changes to the types, routes, or controller are needed — they are already designed for this extension.

---

## Conversation Persistence

Every message (user and assistant) is stored in:
- `AssistantConversation` — one per user session
- `AssistantMessage` — individual messages with role (`USER` | `ASSISTANT`)

Context window: the last **12 messages** are sent to Groq per request to keep token costs predictable.

---

## Security Notes

- The API key is read exclusively from `process.env.GROQ_API_KEY` via the validated `env` object — it is never hardcoded or logged.
- All AI routes are protected by `requireAuth` (Supabase JWT verification).
- The system prompt constrains the assistant to wellness/medication topics and explicitly forbids diagnostic or prescriptive medical claims.
- All AI-generated content is flagged with `fromApi: true` in the response so the UI can display the required "AI-generated" label per `DESIGN.md §9`.

---

## Production Deployment

Set `GROQ_API_KEY` in your Vercel environment variable dashboard:

1. **Vercel Dashboard** → Project → **Settings** → **Environment Variables**
2. Add `GROQ_API_KEY` with your real key
3. Scope it to **Production** (and optionally **Preview**)
4. Redeploy

The key will be available as `process.env.GROQ_API_KEY` inside the serverless function at runtime.
