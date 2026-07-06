import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ---------------------------------------------------------------------------
// Environment schema
// ---------------------------------------------------------------------------
// GROQ_API_KEY is intentionally optional at the schema level so the server
// does NOT crash when the key is absent. The assistant module performs its
// own key-presence check and returns a graceful fallback instead of throwing.
// ---------------------------------------------------------------------------

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid PostgreSQL URL').optional(),

  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL').optional(),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(10, 'SUPABASE_SERVICE_ROLE_KEY appears too short to be valid')
    .optional(),

  // Auth
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
  CORS_ORIGIN: z.string().optional(),

  // Groq AI — optional so the server boots without a key.
  // Replace the placeholder in .env with your real key from https://console.groq.com/keys
  // Keys always begin with "gsk_".
  GROQ_API_KEY: z
    .string()
    .startsWith('gsk_', 'GROQ_API_KEY must start with "gsk_"')
    .optional()
    .refine(
      (val) => val === undefined || val !== 'gsk_your_groq_api_key_here',
      'GROQ_API_KEY still contains the placeholder value — replace it with your real key',
    ),

  // Resend (email)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email('RESEND_FROM_EMAIL must be a valid email address').default('emergency@doseloop.com'),

  // Vercel Cron
  CRON_SECRET: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Parse & validate — exits on hard misconfigurations, warns on soft ones.
// ---------------------------------------------------------------------------

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables detected:\n');
  for (const issue of parseResult.error.issues) {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parseResult.data;

// Warn (but do NOT exit) when the Groq key is missing so the server stays up
// and the assistant module can return its graceful fallback.
if (!env.GROQ_API_KEY) {
  console.warn(
    '⚠️  GROQ_API_KEY is not set. The AI assistant will return a fallback message.\n' +
      '   → Add your key to server/.env: GROQ_API_KEY=gsk_your_real_key_here\n' +
      '   → Get a key at: https://console.groq.com/keys',
  );
}
