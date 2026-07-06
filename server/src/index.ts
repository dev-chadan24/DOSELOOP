import app from './app';

// Vercel Serverless requires exporting the app instance rather than listening on a port.
// We use module.exports instead of export default because @vercel/node expects the raw listener.
module.exports = app;
