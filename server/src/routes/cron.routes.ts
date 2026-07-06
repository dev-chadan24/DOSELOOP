import { Router } from 'express';
import { processReminders } from '../modules/notifications/reminder.engine';
import { logger } from '../config/logger';

const router = Router();

// Endpoint for Vercel Cron Jobs to trigger the reminder engine
router.get('/reminders', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('Unauthorized cron invocation attempt');
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    await processReminders();
    res.status(200).json({ success: true, message: 'Reminders processed successfully.' });
  } catch (error) {
    logger.error('Cron reminder processing failed:', error);
    res.status(500).json({ success: false, error: 'Failed to process reminders.' });
  }
});

export default router;
