import cron from 'node-cron';
import { prisma } from '../../lib/prisma';
import { logger } from '../../config/logger';
import { DoseStatus, NotificationType, DoseEvent, Medication, User } from '@prisma/client';
import { sendEmail } from './email.service';

export const processReminders = async () => {
  logger.info('Processing Reminders...');
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    // Find doses that became due in the last minute
    const dueDoses = await prisma.doseEvent.findMany({
      where: {
        status: DoseStatus.UPCOMING,
        scheduledFor: { lte: now, gt: oneMinuteAgo },
      },
      include: { medication: { include: { user: true } } },
    });

    if (dueDoses.length === 0) return;

    // Create notifications
    const notifications = dueDoses.map((dose: DoseEvent & { medication: Medication }) => ({
      userId: dose.medication.userId,
      title: `${dose.medication.name} is due`,
      body: `Your ${dose.medication.dosage} dose of ${dose.medication.name}. Tap to log when ready.`,
      type: NotificationType.REMINDER,
      isRead: false,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    logger.info(`Processed ${dueDoses.length} due doses.`);

    // Send emails
    for (const dose of dueDoses as (DoseEvent & { medication: Medication & { user: User } })[]) {
      const user = dose.medication.user;
      if (user.emailNotifications) {
        await sendEmail(
          user.email,
          `Time for your medication: ${dose.medication.name}`,
          `<p>Hi ${user.firstName},</p><p>It's time to take your ${dose.medication.dosage} of ${dose.medication.name}.</p><p>Log it in the DoseLoop app.</p>`,
        );
      }
    }
  } catch (error) {
    logger.error('Error processing reminders:', error);
    throw error;
  }
};

export const startReminderEngine = () => {
  // Local development only or deprecated in serverless
  cron.schedule('* * * * *', async () => {
    logger.info('Running Reminder Engine Cron...');
    await processReminders();
  });
};
