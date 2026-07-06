import { prisma } from '@/lib/prisma';

export const updatePreferences = async (
  userId: string,
  prefs: Record<string, boolean | string>,
) => {
  // Whitelist explicitly allowed fields to prevent mass assignment
  const allowedData: any = {};
  if (prefs.theme !== undefined) allowedData.theme = prefs.theme;
  if (prefs.emailNotifications !== undefined) allowedData.emailNotifications = prefs.emailNotifications;
  if (prefs.pushNotifications !== undefined) allowedData.pushNotifications = prefs.pushNotifications;
  if (prefs.privacyEnabled !== undefined) allowedData.privacyEnabled = prefs.privacyEnabled;

  return prisma.user.update({
    where: { id: userId },
    data: allowedData,
  });
};

export const exportData = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      theme: true,
      emailNotifications: true,
      pushNotifications: true,
      privacyEnabled: true,
      createdAt: true,
      updatedAt: true,
      medications: { include: { schedules: true, doses: true } },
      wellnessMetrics: true,
      waterLogs: true,
      familyMemberships: true,
    },
  });
  return user;
};

export const deleteAccount = async (userId: string) => {
  return prisma.user.delete({
    where: { id: userId },
  });
};
