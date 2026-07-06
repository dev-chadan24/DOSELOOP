// ---------------------------------------------------------------------------
// assistant.controller.ts
// HTTP handler layer for the DoseLoop AI assistant module.
//
// Design: controllers are thin — they handle request/response shaping only.
// All business logic lives in assistant.service.ts.
// ---------------------------------------------------------------------------

import { Request, Response } from 'express';
import type { User } from '@supabase/supabase-js';
import { sendSuccess, sendError } from '@/utils/response';
import * as assistantService from './assistant.service';

/** Convenience type for authenticated Express requests. */
type AuthenticatedRequest = Request & { user?: User };

// ---------------------------------------------------------------------------
// POST /api/v1/ai/chat
// ---------------------------------------------------------------------------

/**
 * Sends a message to the Groq AI assistant and returns the reply.
 * The request body is validated upstream by the Zod validate middleware.
 */
export const chat = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const { message } = req.body as { message: string };

    const result = await assistantService.chatCompletion(user.id, message);

    return sendSuccess(res, result, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return sendError(res, message, 500);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/ai/history
// ---------------------------------------------------------------------------

/**
 * Returns the full chronological message history for the authenticated user's
 * most recent conversation.
 */
export const getHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const history = await assistantService.getHistory(user.id);

    return sendSuccess(res, history, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return sendError(res, message, 500);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/ai/conversation/new
// ---------------------------------------------------------------------------

/**
 * Starts a fresh conversation for the authenticated user.
 * The previous conversation is retained in the database but future messages
 * are routed to the new conversation.
 */
export const newConversation = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return sendError(res, 'Unauthorized', 401);
    }

    const conversationId = await assistantService.startNewConversation(user.id);

    return sendSuccess(res, { conversationId }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return sendError(res, message, 500);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/ai/history
// ---------------------------------------------------------------------------

/**
 * Permanently deletes all conversation history for the authenticated user.
 * Used for privacy and account-deletion flows.
 */
export const deleteHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return sendError(res, 'Unauthorized', 401);
    }

    await assistantService.clearHistory(user.id);

    return sendSuccess(res, { deleted: true }, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return sendError(res, message, 500);
  }
};
