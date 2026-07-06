/**
 * Global Express type augmentations for DoseLoop.
 *
 * Declaration merging extends the Express.Request interface so that
 * custom properties (e.g. `req.id`) are recognised across the codebase
 * without ad-hoc type casts.
 */

declare global {
  namespace Express {
    interface Request {
      /** Unique request trace ID injected by the request-id middleware. */
      id: string;
    }
  }
}

export {};
