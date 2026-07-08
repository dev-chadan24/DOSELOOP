import winston from 'winston';
import { env } from './env';

// ---------------------------------------------------------------------------
// Structured JSON logger — compatible with Google Cloud Logging
// ---------------------------------------------------------------------------
// Cloud Run captures stdout/stderr and sends it to Cloud Logging. For logs to
// be parsed correctly (severity, message, labels, trace), they must be emitted
// as newline-delimited JSON objects (structured logging format).
//
// In development we use a human-readable colorized format for DX. In production
// we emit pure JSON so Cloud Logging can ingest, filter, and alert on logs.
// ---------------------------------------------------------------------------

const isProduction = env.NODE_ENV === 'production';

// Google Cloud Logging uses "severity" not "level" — map Winston levels.
const googleSeverityMap: Record<string, string> = {
  error: 'ERROR',
  warn: 'WARNING',
  info: 'INFO',
  http: 'INFO',
  verbose: 'DEBUG',
  debug: 'DEBUG',
  silly: 'DEBUG',
};

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    const entry: Record<string, unknown> = {
      severity: googleSeverityMap[level] ?? 'DEFAULT',
      message,
      timestamp,
      ...metadata,
    };
    // Include stack traces for errors (helps Cloud Error Reporting)
    if (stack) {
      entry.stack_trace = stack;
    }
    return JSON.stringify(entry);
  }),
);

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  }),
);

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? productionFormat : developmentFormat,
  transports: [
    // Always write to stdout — Cloud Run captures this stream automatically.
    // Never write to files — containers have ephemeral filesystems.
    new winston.transports.Console(),
  ],
});
