// ---------------------------------------------------------------------------
// assistant.routes.ts
// Express router for the DoseLoop AI assistant module.
// Mounted at /api/v1/ai in app.ts.
//
// All routes require authentication (requireAuth middleware).
// Request bodies are validated by the reusable Zod validate middleware.
// A dedicated rate-limiter caps AI endpoint usage per IP.
// ---------------------------------------------------------------------------

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../auth/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { chat, getHistory, newConversation, deleteHistory } from './assistant.controller';

const router = Router();

// ---------------------------------------------------------------------------
// AI-specific rate limiter
// More restrictive than the global limiter in app.ts to prevent LLM abuse.
// This is the "preparation" layer — swap in a Redis store (e.g. rate-limit-redis)
// when you move to a multi-instance deployment.
// ---------------------------------------------------------------------------
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1_000,        // 1-minute rolling window
  max: 20,                      // 20 requests per IP per minute
  standardHeaders: true,        // Return RateLimit-* headers per draft-6
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many AI requests — please wait a moment before trying again.',
    },
  },
  skip: (req) => {
    // Skip rate-limiting for the history endpoints (read-only, not LLM calls).
    return req.method === 'GET';
  },
});

// ---------------------------------------------------------------------------
// Request body schemas (Zod)
// ---------------------------------------------------------------------------

const chatSchema = z.object({
  body: z.object({
    /** The user's message — must be a non-empty string, max 2000 chars. */
    message: z
      .string()
      .min(1, 'Message must not be empty.')
      .max(2_000, 'Message must be 2000 characters or fewer.'),
  }),
});

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// All assistant routes require a valid auth token.
router.use(requireAuth);

// Apply AI rate limiter to all assistant routes (skips GET internally).
router.use(aiRateLimiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/ai/history
 * Returns the authenticated user's full conversation history.
 */
router.get('/history', getHistory);

/**
 * POST /api/v1/ai/chat
 * Send a message to the Groq AI assistant.
 * Body: { message: string }
 */
router.post('/chat', validate(chatSchema), chat);

/**
 * POST /api/v1/ai/conversation/new
 * Starts a fresh conversation session (retains old messages in DB).
 */
router.post('/conversation/new', newConversation);

/**
 * DELETE /api/v1/ai/history
 * Permanently deletes all conversation history for the authenticated user.
 */
router.delete('/history', deleteHistory);

export default router;
