import { prisma } from '@/lib/prisma';
import { WellnessTone } from '@prisma/client';

export const getWellnessHistory = async (
  userId: string,
  type: 'all' | 'mood' | 'water' = 'all',
) => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const data: Record<string, unknown> = {};

  if (type === 'all' || type === 'mood') {
    data.moods = await prisma.wellnessMetric.findMany({
      where: { userId, recordedAt: { gte: startOfWeek } },
      orderBy: { recordedAt: 'asc' },
    });
  }

  if (type === 'all' || type === 'water') {
    data.waterLogs = await prisma.waterLog.findMany({
      where: { userId, recordedAt: { gte: startOfWeek } },
      orderBy: { recordedAt: 'asc' },
    });
  }

  return data;
};

export const logWellness = async (
  userId: string,
  label: string,
  icon: string,
  value: number,
  unit: string,
  goal?: number,
  tone?: WellnessTone,
) => {
  return prisma.wellnessMetric.create({
    data: {
      userId,
      label,
      icon,
      value,
      unit,
      goal,
      tone: tone || WellnessTone.INFO,
    },
  });
};

export const logWater = async (userId: string, amountMl: number) => {
  return prisma.waterLog.create({
    data: {
      userId,
      amountMl,
    },
  });
};
