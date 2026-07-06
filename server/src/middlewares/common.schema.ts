import { z } from 'zod';

// ---------------------------------------------------------------------------
// Pagination — validates req.query.page and req.query.limit
// ---------------------------------------------------------------------------
export const paginationSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .default('1')
      .transform(Number)
      .pipe(z.number().int().min(1)),
    limit: z
      .string()
      .optional()
      .default('50')
      .transform(Number)
      .pipe(z.number().int().min(1).max(100)),
  }),
});

// ---------------------------------------------------------------------------
// UUID path parameter — validates req.params.id
// ---------------------------------------------------------------------------
export const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid resource ID'),
  }),
});
