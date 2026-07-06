import { prisma } from '../../lib/prisma';
import { User } from '@prisma/client';

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  return mapToFrontendProfile(user);
};

export const updateUserProfile = async (
  userId: string,
  data: { firstName?: string; lastName?: string; plan?: string },
) => {
  // Validate and update fields
  const updateData: { firstName?: string; lastName?: string; plan?: string } = {};
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.plan !== undefined) updateData.plan = data.plan;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return mapToFrontendProfile(user);
};

function mapToFrontendProfile(user: User) {
  const name = `${user.firstName} ${user.lastName || ''}`.trim();
  const firstInitial = user.firstName ? user.firstName[0] : '';
  const lastInitial = user.lastName ? user.lastName[0] : '';
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return {
    id: user.id,
    name,
    firstName: user.firstName,
    lastName: user.lastName,
    initials,
    email: user.email,
    plan: user.plan === 'free' ? 'Self-managing patient' : user.plan,
  };
}
