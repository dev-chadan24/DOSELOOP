import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { logger } from './config/logger';
import { env } from './config/env';
import { requestId } from './middlewares/request-id.middleware';
import { generalLimiter, authLimiter } from './config/rate-limit';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import healthRoutes from './routes/health.routes';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import medicationsRoutes from './modules/medications/medications.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import emergencyRoutes from './modules/emergency/emergency.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import familyRoutes from './modules/family/family.routes';
import wellnessRoutes from './modules/wellness/wellness.routes';
import feedbackRoutes from './modules/feedback/feedback.routes';
import settingsRoutes from './modules/settings/settings.routes';
import assistantRoutes from './modules/assistant/assistant.routes';
import cronRoutes from './routes/cron.routes';
import { startReminderEngine } from './modules/notifications/reminder.engine';
const app = express();

// startReminderEngine(); // Disabled for Vercel Serverless. Will be triggered via API Cron.

// ---------------------------------------------------------------------------
// Request ID — must be first so every downstream layer has access
// ---------------------------------------------------------------------------
app.use(requestId);

// ---------------------------------------------------------------------------
// Security Headers — Helmet with production-grade policies
// ---------------------------------------------------------------------------
const isProduction = env.NODE_ENV === 'production';

app.use(
  helmet({
    // Content Security Policy — conservative baseline that does not break the
    // React SPA.  The frontend is served from a separate origin so these
    // directives only govern the API's own responses.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    // Deny framing to prevent clickjacking
    frameguard: { action: 'deny' },
    // Strict referrer to limit information leakage
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Prevent DNS prefetch to reduce information leakage
    dnsPrefetchControl: { allow: false },
    // Hide Express fingerprint
    hidePoweredBy: true,
    // Prevent MIME-type sniffing
    noSniff: true,
    // HSTS — production only (2 years, include sub-domains, allow preload)
    strictTransportSecurity: isProduction
      ? { maxAge: 63_072_000, includeSubDomains: true, preload: true }
      : false,
    // XSS filter — deprecated in modern browsers but harmless defence-in-depth
    xssFilter: true,
    // Origin Agent Cluster — opt into keying by origin for isolation
    originAgentCluster: true,
    // Cross-Origin policies
    crossOriginEmbedderPolicy: false, // keep false to avoid breaking CORS
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// Permissions Policy header (not covered by Helmet)
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()',
  );
  next();
});

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: env.CORS_ORIGIN || (env.NODE_ENV === 'development' ? 'http://localhost:5173' : false),
    credentials: true,
  }),
);

// ---------------------------------------------------------------------------
// Compression & Body Parsing
// ---------------------------------------------------------------------------
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// HTTP Logging — includes request ID and response time
// ---------------------------------------------------------------------------
morgan.token('req-id', (req) => (req as express.Request).id);

app.use(
  morgan(':method :url :status :response-time ms - reqId=:req-id', {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// ---------------------------------------------------------------------------
// Health — MUST be before the general rate limiter so monitoring
// agents, container orchestrators, and load balancers are never throttled.
// ---------------------------------------------------------------------------
app.use('/api/v1/health', healthRoutes);

// ---------------------------------------------------------------------------
// General Rate Limiter — applied to everything except /health above
// ---------------------------------------------------------------------------
app.use(generalLimiter);

// ---------------------------------------------------------------------------
// Routes — auth gets its own stricter limiter
// ---------------------------------------------------------------------------
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/medications', medicationsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/emergency', emergencyRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/family', familyRoutes);
app.use('/api/v1/wellness', wellnessRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/ai', assistantRoutes);
app.use('/api/v1/cron', cronRoutes);

// ---------------------------------------------------------------------------
// Fallback handlers
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
