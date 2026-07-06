import { prisma } from '@/lib/prisma';
import { User } from '@supabase/supabase-js';

export const syncUserWithDb = async (supabaseUser: User) => {
  const { id, email, user_metadata } = supabaseUser;

  if (!email) {
    throw new Error('User email is required');
  }

  let firstName = user_metadata?.firstName;
  let lastName = user_metadata?.lastName || null;

  if (!firstName && user_metadata?.full_name) {
    const parts = user_metadata.full_name.split(' ');
    firstName = parts[0];
    lastName = parts.slice(1).join(' ') || null;
  }

  if (!firstName) {
    firstName = email.split('@')[0];
  }

  return prisma.user.upsert({
    where: { id },
    update: {
      email,
      firstName,
      lastName,
    },
    create: {
      id,
      email,
      firstName,
      lastName,
    },
  });
};
