// Low-level Resend transport — SERVER ONLY (uses secret credentials).
// Routes through the Lovable connector gateway, never the Resend API directly.
//
// This file is blocked from client bundles by the *.server.* convention.

import { getEmailConfig, RESEND_GATEWAY_URL } from "./config";
import { emailLogger, maskRecipients } from "./logger";
import type { SendEmailInput, SendEmailResult } from "./types";

// Minimal RFC-5322-ish address sanity check (also accepts "Name <addr>").
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim();
}

function isValidAddress(value: string): boolean {
  return EMAIL_RE.test(extractAddress(value));
}

function validateRecipients(to: string | string[]): string | null {
  const list = Array.isArray(to) ? to : [to];
  if (list.length === 0) return "No recipient provided";
  for (const addr of list) {
    if (!addr || !isValidAddress(addr)) return `Invalid recipient address: ${addr}`;
  }
  return null;
}

/**
 * Sends a single email through Resend via the connector gateway.
 * Never throws — always returns a normalised SendEmailResult so callers can
 * branch safely and the rest of the app keeps working.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { configured, missing, config } = getEmailConfig();

  if (!configured || !config) {
    emailLogger.warn("Email not configured — send skipped", { missing });
    return {
      ok: false,
      code: "not_configured",
      error: `Email service is not configured. Missing: ${missing.join(", ")}`,
    };
  }

  const recipientError = validateRecipients(input.to);
  if (recipientError) {
    emailLogger.warn("Email send rejected — invalid input", { reason: recipientError });
    return { ok: false, code: "invalid_input", error: recipientError };
  }
  if (!input.subject?.trim()) {
    return { ok: false, code: "invalid_input", error: "Email subject is required" };
  }
  if (!input.html?.trim()) {
    return { ok: false, code: "invalid_input", error: "Email html body is required" };
  }

  const payload: Record<string, unknown> = {
    from: input.from?.trim() || config.from,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
  };
  if (input.text) payload.text = input.text;
  if (input.cc) payload.cc = Array.isArray(input.cc) ? input.cc : [input.cc];
  if (input.bcc) payload.bcc = Array.isArray(input.bcc) ? input.bcc : [input.bcc];
  const replyTo = input.replyTo || config.replyTo;
  if (replyTo) payload.reply_to = replyTo;

  const maskedTo = maskRecipients(input.to);

  try {
    const response = await fetch(`${RESEND_GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.lovableApiKey}`,
        "X-Connection-Api-Key": config.resendApiKey,
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let parsed: unknown;
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = { message: raw };
    }

    if (!response.ok) {
      const message =
        (parsed as { message?: string; error?: string })?.message ||
        (parsed as { error?: string })?.error ||
        `HTTP ${response.status}`;
      emailLogger.error("Provider rejected email", {
        to: maskedTo,
        subject: input.subject,
        status: response.status,
        message,
      });
      return { ok: false, code: "provider_error", error: message };
    }

    const id = (parsed as { id?: string })?.id ?? "unknown";
    emailLogger.info("Email sent", { to: maskedTo, subject: input.subject, id });
    return { ok: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    emailLogger.error("Network error sending email", { to: maskedTo, message });
    return { ok: false, code: "network_error", error: message };
  }
}
