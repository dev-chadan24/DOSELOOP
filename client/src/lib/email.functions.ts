// App-callable RPC wrappers around the email service.
// Safe to import from components/loaders — the build replaces handler bodies
// with RPC stubs in client bundles, so the secret-using service code in
// `*.server.ts` never reaches the browser.
//
// NOTE: these run on the server but are reachable by the client. Inputs are
// validated with Zod. For auth-sensitive flows (verification / password reset)
// gate these behind your auth layer before exposing them to untrusted callers.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMedicineReminderEmail,
  sendAppointmentReminderEmail,
} from "./email/service.server";

const email = z.string().email();
const url = z.string().url();

const welcomeSchema = z.object({
  to: email,
  name: z.string().min(1).max(120),
});

const verificationSchema = z.object({
  to: email,
  name: z.string().min(1).max(120),
  verificationUrl: url,
  expiresInMinutes: z.number().int().positive().max(1440).optional(),
});

const passwordResetSchema = z.object({
  to: email,
  name: z.string().min(1).max(120),
  resetUrl: url,
  expiresInMinutes: z.number().int().positive().max(1440).optional(),
});

const medicineReminderSchema = z.object({
  to: email,
  name: z.string().min(1).max(120),
  medicationName: z.string().min(1).max(160),
  dosage: z.string().min(1).max(80),
  scheduledTime: z.string().min(1).max(80),
  instructions: z.string().max(500).optional(),
});

const appointmentReminderSchema = z.object({
  to: email,
  name: z.string().min(1).max(120),
  title: z.string().min(1).max(160),
  when: z.string().min(1).max(120),
  location: z.string().max(200).optional(),
  provider: z.string().max(160).optional(),
  notes: z.string().max(500).optional(),
});

export const sendWelcomeEmailFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => welcomeSchema.parse(data))
  .handler(({ data }) => sendWelcomeEmail(data.to, { name: data.name }));

export const sendVerificationEmailFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verificationSchema.parse(data))
  .handler(({ data }) =>
    sendVerificationEmail(data.to, {
      name: data.name,
      verificationUrl: data.verificationUrl,
      expiresInMinutes: data.expiresInMinutes,
    }),
  );

export const sendPasswordResetEmailFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => passwordResetSchema.parse(data))
  .handler(({ data }) =>
    sendPasswordResetEmail(data.to, {
      name: data.name,
      resetUrl: data.resetUrl,
      expiresInMinutes: data.expiresInMinutes,
    }),
  );

export const sendMedicineReminderEmailFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => medicineReminderSchema.parse(data))
  .handler(({ data }) =>
    sendMedicineReminderEmail(data.to, {
      name: data.name,
      medicationName: data.medicationName,
      dosage: data.dosage,
      scheduledTime: data.scheduledTime,
      instructions: data.instructions,
    }),
  );

export const sendAppointmentReminderEmailFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => appointmentReminderSchema.parse(data))
  .handler(({ data }) =>
    sendAppointmentReminderEmail(data.to, {
      name: data.name,
      title: data.title,
      when: data.when,
      location: data.location,
      provider: data.provider,
      notes: data.notes,
    }),
  );
