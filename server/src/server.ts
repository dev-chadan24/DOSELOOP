import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`✅ Local Development Server running on port ${PORT}`);
  logger.info(`🌍 Access at: http://localhost:${PORT}`);
});
