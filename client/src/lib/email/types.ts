// Shared types for the email service.
// These are client-safe (no secrets, no server-only imports).

export type EmailAddress = string;

/** A fully rendered email ready to be sent. */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Low-level payload accepted by the Resend transport. */
export interface SendEmailInput {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text?: string;
  /** Optional override of the configured "from" address. */
  from?: EmailAddress;
  replyTo?: EmailAddress;
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
}

/** Normalised result returned by every send operation. */
export type SendEmailResult =
  { ok: true; id: string } | { ok: false; error: string; code: EmailErrorCode };

export type EmailErrorCode =
  "not_configured" | "invalid_input" | "provider_error" | "network_error" | "unknown_error";

// --- Template data contracts -------------------------------------------------

export interface WelcomeEmailData {
  name: string;
}

export interface VerificationEmailData {
  name: string;
  verificationUrl: string;
  /** Minutes until the link expires. Defaults to 60 when omitted. */
  expiresInMinutes?: number;
}

export interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export interface MedicineReminderEmailData {
  name: string;
  medicationName: string;
  dosage: string;
  /** Human-readable scheduled time, e.g. "8:00 AM". */
  scheduledTime: string;
  instructions?: string;
}

export interface AppointmentReminderEmailData {
  name: string;
  title: string;
  /** Human-readable date & time, e.g. "Mon, 6 Jul 2026 · 10:30 AM". */
  when: string;
  location?: string;
  provider?: string;
  notes?: string;
}
