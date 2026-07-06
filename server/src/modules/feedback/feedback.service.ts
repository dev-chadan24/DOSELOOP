import { prisma } from '@/lib/prisma';

export const submitFeedback = async (userId: string, category: string, text: string) => {
  return prisma.feedback.create({
    data: {
      userId,
      category,
      text,
    },
  });
};
