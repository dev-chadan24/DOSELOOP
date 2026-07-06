import { logger } from '../../config/logger';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY missing, skipping email to', to);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DoseLoop <notifications@doseloop.app>', // Change domain if needed in real prod
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      logger.error(`Failed to send email via Resend: ${await res.text()}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
};
