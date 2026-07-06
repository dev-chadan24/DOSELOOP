// Client-safe entry point for the email module.
// Exposes types and the app-callable RPC wrappers. The secret-using transport
// and service live in `*.server.ts` files and must NOT be imported from the
// client — import from `./email/service.server` in server code instead.

export type * from "./types";
export {
  sendWelcomeEmailFn,
  sendVerificationEmailFn,
  sendPasswordResetEmailFn,
  sendMedicineReminderEmailFn,
  sendAppointmentReminderEmailFn,
} from "../email.functions";
