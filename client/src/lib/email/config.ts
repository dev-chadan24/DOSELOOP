// Centralised, validated configuration for the email service.
// Reads ONLY from environment variables — never hardcode credentials.
//
// Required (provided by the linked Resend connector):
//   RESEND_API_KEY        — Resend connection key (used as the gateway auth key)
//   LOVABLE_API_KEY       — bearer token for the Lovable connector gateway
//
// Optional (with safe defaults):
//   EMAIL_FROM            — default "from" address (default: DoseLoop <onboarding@resend.dev>)
//   EMAIL_REPLY_TO        — default reply-to address
//   APP_NAME              — product name used in templates (default: DoseLoop)

export const RESEND_GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export interface EmailConfig {
  resendApiKey: string;
  lovableApiKey: string;
  from: string;
  replyTo?: string;
  appName: string;
}

export interface EmailConfigResult {
  configured: boolean;
  /** Names of required env vars that are missing. */
  missing: string[];
  config?: EmailConfig;
}

const DEFAULT_FROM = "DoseLoop <onboarding@resend.dev>";
const DEFAULT_APP_NAME = "DoseLoop";

/**
 * Resolves and validates the email configuration from the environment.
 * Never throws — callers decide how to handle a missing configuration so the
 * rest of the app keeps working even when email is not yet provisioned.
 */
export function getEmailConfig(): EmailConfigResult {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const lovableApiKey = process.env.LOVABLE_API_KEY?.trim();

  const missing: string[] = [];
  if (!resendApiKey) missing.push("RESEND_API_KEY");
  if (!lovableApiKey) missing.push("LOVABLE_API_KEY");

  if (!resendApiKey || !lovableApiKey) {
    return { configured: false, missing };
  }

  return {
    configured: true,
    missing: [],
    config: {
      resendApiKey,
      lovableApiKey,
      from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
      replyTo: process.env.EMAIL_REPLY_TO?.trim() || undefined,
      appName: process.env.APP_NAME?.trim() || DEFAULT_APP_NAME,
    },
  };
}

/** Convenience boolean for feature flags / health checks. */
export function isEmailConfigured(): boolean {
  return getEmailConfig().configured;
}
