# Goal Description
Execute Phase C (Production Security Hardening) on the DoseLoop platform. This phase focuses on deep infrastructural security including advanced header protections, rate-limiting layers, audit logging, request tracing, and standardized query validation, without modifying any business logic or APIs.

## User Review Required
Please review the proposed security hardening changes. These modifications are strictly infrastructural and designed to preserve 100% backward compatibility for the frontend and mobile clients.

## Proposed Changes

---

### Part 1 & 7: Helmet & Security Headers
#### [MODIFY] `server/src/app.ts`
- Enhance `helmet()` configuration with explicit, production-grade policies:
  - `contentSecurityPolicy`: Establish a baseline policy (e.g., `defaultSrc: ["'self'"]`).
  - `referrerPolicy`: Set to `strict-origin-when-cross-origin`.
  - `frameguard`: Deny framing.
  - `xssFilter`: Enabled.
  - `hidePoweredBy`: Enabled.
  - `dnsPrefetchControl`: Disabled.
  - `hsts`: Enable strict transport security in production environments.

---

### Part 2: Rate Limiting
#### [NEW] `server/src/config/rate-limit.ts`
- Create predefined limiters:
  - `generalLimiter`: 100 requests / 15 minutes.
  - `authLimiter`: 10 requests / 15 minutes (stricter limit for authentication/sync/reset flows).
#### [MODIFY] `server/src/app.ts`
- Apply `generalLimiter` globally, and `authLimiter` strictly to `authRoutes`.

---

### Part 3 & 6: Request Tracing & Response Timing
#### [NEW] `server/src/middlewares/request-id.middleware.ts`
- Inject a UUID into `req.id` for every request.
- Attach `X-Request-Id` to all HTTP responses.
#### [MODIFY] `server/src/app.ts`
- Update the Morgan logger format to include both `:response-time ms` and the unique `req-id`.
#### [MODIFY] `server/src/middlewares/error.middleware.ts`
- Include `req.id` within internal error logs and surface the `requestId` in API error payloads to assist production debugging.
- Add `id` to the global `Express.Request` type declaration.

---

### Part 4: Audit Logging
#### [NEW] `server/src/modules/audit/audit.service.ts`
- Expose a `logAuditAction` utility that securely interfaces with the existing Prisma `AuditLog` model (storing `userId`, `action`, `entity`, `ip`, and `requestId`).
- Explicitly mask or discard any sensitive payloads (like passwords, PHI, JWTs).
#### [MODIFY] controllers (e.g., Auth, Medications, Settings)
- Inject the `logAuditAction` invocation directly following successful mutations (e.g., Sync, Create/Update/Delete).

---

### Part 5: Query Validation
#### [NEW] `server/src/middlewares/common.schema.ts`
- Define standard Zod schemas for `paginationSchema` (validating `page` and `limit`) and `uuidParamSchema` (validating `id` parameters).
#### [MODIFY] `server/src/modules/medications/medications.routes.ts` (and Emergency/Notifications)
- Prepend the `validate(paginationSchema)` and `validate(uuidParamSchema)` middlewares to all relevant GET and DELETE endpoints, stripping manual coercion logic from the service layer.

---

### Part 8 & 9: Environment & Dependency Review
- Verify that deprecated packages or unsafe defaults do not exist in the middleware stack. 

## Verification Plan
### Automated Tests
- Run `npm run build` or `npx tsc --noEmit` in `server` to guarantee type safety and compilation success.
- Start the server to confirm middleware boots without exception.
### Manual Verification
- Review Morgan output to ensure request IDs and durations are logged.
- Inspect the Express types to verify `req.id` augmentation is functional.
