// Minimal structured logger for the email service.
// Keeps a single, greppable prefix and never logs secrets or full recipient
// addresses (recipients are masked) so logs are safe to ship.

type LogLevel = "info" | "warn" | "error";

function maskRecipient(value: string): string {
  const [local, domain] = value.split("@");
  if (!domain) return "***";
  const head = local.slice(0, 2);
  return `${head}${local.length > 2 ? "***" : ""}@${domain}`;
}

export function maskRecipients(to: string | string[]): string {
  const list = Array.isArray(to) ? to : [to];
  return list.map(maskRecipient).join(", ");
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  const line = `[email] ${message}${payload}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const emailLogger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
};
