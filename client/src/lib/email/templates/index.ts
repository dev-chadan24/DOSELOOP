import type {
  RenderedEmail,
  WelcomeEmailData,
  VerificationEmailData,
  PasswordResetEmailData,
  MedicineReminderEmailData,
  AppointmentReminderEmailData,
} from "../types";
import { renderLayout, escapeHtml } from "./layout";

// Each builder returns a fully rendered email (subject + html + text).
// Pure functions: no secrets, no I/O. `appName` is injected by the service.

export function renderWelcomeEmail(appName: string, data: WelcomeEmailData): RenderedEmail {
  const name = escapeHtml(data.name);
  const subject = `Welcome to ${appName} 🌿`;
  const html = renderLayout({
    appName,
    previewText: `Welcome to ${appName} — your calm health companion.`,
    heading: `Welcome, ${name}`,
    bodyHtml: `
      <p style="margin:0 0 12px;">We're so glad you're here. ${escapeHtml(appName)} helps you and your family stay on top of medications, wellness, and care — quietly and without the noise.</p>
      <p style="margin:0 0 12px;">Here's what you can do next:</p>
      <ul style="margin:0 0 12px;padding-left:18px;">
        <li style="margin-bottom:6px;">Add your first medication and schedule a calm reminder.</li>
        <li style="margin-bottom:6px;">Invite a family member to your Circle.</li>
        <li style="margin-bottom:6px;">Set your notification preferences — one quiet daily budget.</li>
      </ul>
      <p style="margin:0;">Peace of mind is the whole point. We'll keep it gentle.</p>`,
  });
  const text = `Welcome to ${appName}, ${data.name}!

We're glad you're here. ${appName} helps you and your family stay on top of medications, wellness, and care.

Next steps:
- Add your first medication and schedule a reminder.
- Invite a family member to your Circle.
- Set your notification preferences.

Peace of mind is the whole point.`;
  return { subject, html, text };
}

export function renderVerificationEmail(
  appName: string,
  data: VerificationEmailData,
): RenderedEmail {
  const name = escapeHtml(data.name);
  const expires = data.expiresInMinutes ?? 60;
  const subject = `Verify your ${appName} email`;
  const html = renderLayout({
    appName,
    previewText: `Confirm your email to finish setting up ${appName}.`,
    heading: "Confirm your email",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${name}, please confirm this email address to finish setting up your ${escapeHtml(appName)} account.</p>
      <p style="margin:0;">This link expires in ${expires} minutes.</p>`,
    cta: { label: "Verify email", url: data.verificationUrl },
    footnote: "If you didn't create this account, you can safely ignore this email.",
  });
  const text = `Hi ${data.name},

Confirm your email to finish setting up your ${appName} account:
${data.verificationUrl}

This link expires in ${expires} minutes. If you didn't create this account, ignore this email.`;
  return { subject, html, text };
}

export function renderPasswordResetEmail(
  appName: string,
  data: PasswordResetEmailData,
): RenderedEmail {
  const name = escapeHtml(data.name);
  const expires = data.expiresInMinutes ?? 30;
  const subject = `Reset your ${appName} password`;
  const html = renderLayout({
    appName,
    previewText: `Reset your ${appName} password.`,
    heading: "Reset your password",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${name}, we received a request to reset your ${escapeHtml(appName)} password.</p>
      <p style="margin:0;">Tap the button below to choose a new one. This link expires in ${expires} minutes.</p>`,
    cta: { label: "Reset password", url: data.resetUrl },
    footnote:
      "If you didn't request a password reset, no action is needed — your password stays the same.",
  });
  const text = `Hi ${data.name},

Reset your ${appName} password using this link:
${data.resetUrl}

This link expires in ${expires} minutes. If you didn't request this, ignore this email.`;
  return { subject, html, text };
}

export function renderMedicineReminderEmail(
  appName: string,
  data: MedicineReminderEmailData,
): RenderedEmail {
  const name = escapeHtml(data.name);
  const med = escapeHtml(data.medicationName);
  const dosage = escapeHtml(data.dosage);
  const time = escapeHtml(data.scheduledTime);
  const subject = `Reminder: ${data.medicationName} at ${data.scheduledTime}`;
  const instructions = data.instructions
    ? `<p style="margin:12px 0 0;">${escapeHtml(data.instructions)}</p>`
    : "";
  const html = renderLayout({
    appName,
    previewText: `Time for ${data.medicationName} (${data.dosage}).`,
    heading: "Medication reminder",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${name}, this is a gentle reminder for your medication.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0;border:1px solid #e6e1d6;border-radius:12px;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#1c2024;">${med}</p>
          <p style="margin:0;font-size:14px;color:#5c6770;">${dosage} · ${time}</p>
        </td></tr>
      </table>
      ${instructions}`,
  });
  const text = `Hi ${data.name},

Medication reminder:
${data.medicationName} — ${data.dosage} at ${data.scheduledTime}${data.instructions ? `\n${data.instructions}` : ""}`;
  return { subject, html, text };
}

export function renderAppointmentReminderEmail(
  appName: string,
  data: AppointmentReminderEmailData,
): RenderedEmail {
  const name = escapeHtml(data.name);
  const title = escapeHtml(data.title);
  const when = escapeHtml(data.when);
  const subject = `Upcoming: ${data.title} — ${data.when}`;
  const rows = [
    ["When", when],
    data.location ? ["Where", escapeHtml(data.location)] : null,
    data.provider ? ["With", escapeHtml(data.provider)] : null,
  ].filter(Boolean) as [string, string][];
  const detailRows = rows
    .map(
      ([label, value]) =>
        `<tr>
           <td style="padding:6px 0;font-size:13px;color:#5c6770;width:64px;vertical-align:top;">${label}</td>
           <td style="padding:6px 0;font-size:14px;color:#1c2024;font-weight:600;">${value}</td>
         </tr>`,
    )
    .join("");
  const notes = data.notes ? `<p style="margin:12px 0 0;">${escapeHtml(data.notes)}</p>` : "";
  const html = renderLayout({
    appName,
    previewText: `Upcoming appointment: ${data.title} on ${data.when}.`,
    heading: "Appointment reminder",
    bodyHtml: `
      <p style="margin:0 0 12px;">Hi ${name}, here's a reminder for your upcoming appointment.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0;border:1px solid #e6e1d6;border-radius:12px;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#1c2024;">${title}</p>
          <table role="presentation" cellpadding="0" cellspacing="0">${detailRows}</table>
        </td></tr>
      </table>
      ${notes}`,
  });
  const text = `Hi ${data.name},

Appointment reminder: ${data.title}
When: ${data.when}${data.location ? `\nWhere: ${data.location}` : ""}${data.provider ? `\nWith: ${data.provider}` : ""}${data.notes ? `\n\n${data.notes}` : ""}`;
  return { subject, html, text };
}
