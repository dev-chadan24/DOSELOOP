import { prisma } from '../../lib/prisma';
import { Notification, NotificationType } from '@prisma/client';

export const getNotifications = async (userId: string, page: number, limit: number) => {
  limit = Math.max(1, Math.min(limit, 100));
  page = Math.max(1, page);
  const skip = (page - 1) * limit;

  const [totalCount, notifs] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const data = notifs.map(mapToFrontendNotification);

  return {
    data,
    meta: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit,
    },
  };
};

export const markAsRead = async (userId: string, notificationId: string) => {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif || notif.userId !== userId) return false;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return true;
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return true;
};

function mapToFrontendNotification(notif: Notification) {
  let tone = 'gentle';
  if (notif.type === NotificationType.REMINDER) tone = 'reminder';
  if (notif.type === NotificationType.ALERT) tone = 'circle';
  if (notif.type === NotificationType.DIGEST) tone = 'digest';

  // Format time (e.g. "Just now", or standard time) - simple fallback for now
  const timeDiffMs = new Date().getTime() - new Date(notif.createdAt).getTime();
  const minutes = Math.floor(timeDiffMs / (1000 * 60));
  let timeStr = 'Just now';
  if (minutes > 0 && minutes < 60) timeStr = `${minutes}m ago`;
  else if (minutes >= 60) timeStr = `${Math.floor(minutes / 60)}h ago`;

  return {
    id: notif.id,
    title: notif.title,
    body: notif.body,
    time: timeStr,
    tone,
    unread: !notif.isRead,
  };
}
