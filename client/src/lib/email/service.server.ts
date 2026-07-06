// High-level email service — SERVER ONLY.
// Composes templates + transport into intent-revealing functions the rest of
// the application calls. Add new email types here as the product grows.

import { sendEmail } from "./client.server";
import { getEmailConfig } from "./config";
import {
  renderWelcomeEmail,
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderMedicineReminderEmail,
  renderAppointmentReminderEmail,
} from "./templates";
import type {
  SendEmailResult,
  WelcomeEmailData,
  VerificationEmailData,
  PasswordResetEmailData,
  MedicineReminderEmailData,
  AppointmentReminderEmailData,
} from "./types";

function appName(): string {
  return getEmailConfig().config?.appName ?? "DoseLoop";
}

export function sendWelcomeEmail(
  to: string | string[],
  data: WelcomeEmailData,
): Promise<SendEmailResult> {
  const { subject, html, text } = renderWelcomeEmail(appName(), data);
  return sendEmail({ to, subject, html, text });
}

export function sendVerificationEmail(
  to: string | string[],
  data: VerificationEmailData,
): Promise<SendEmailResult> {
  const { subject, html, text } = renderVerificationEmail(appName(), data);
  return sendEmail({ to, subject, html, text });
}

export function sendPasswordResetEmail(
  to: string | string[],
  data: PasswordResetEmailData,
): Promise<SendEmailResult> {
  const { subject, html, text } = renderPasswordResetEmail(appName(), data);
  return sendEmail({ to, subject, html, text });
}

export function sendMedicineReminderEmail(
  to: string | string[],
  data: MedicineReminderEmailData,
): Promise<SendEmailResult> {
  const { subject, html, text } = renderMedicineReminderEmail(appName(), data);
  return sendEmail({ to, subject, html, text });
}

export function sendAppointmentReminderEmail(
  to: string | string[],
  data: AppointmentReminderEmailData,
): Promise<SendEmailResult> {
  const { subject, html, text } = renderAppointmentReminderEmail(appName(), data);
  return sendEmail({ to, subject, html, text });
}

// Re-export the raw transport for custom / future one-off emails.
export { sendEmail } from "./client.server";
