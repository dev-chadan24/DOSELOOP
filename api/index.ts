// Vercel Serverless Function entrypoint.
// @vercel/node compiles this file at the repo root so it can resolve
// '../server/src/app' across the monorepo boundary.
import app from '../server/src/app';

module.exports = app;
