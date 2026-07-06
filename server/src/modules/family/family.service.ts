import { prisma } from '@/lib/prisma';
import { FamilyRole, FamilyMember } from '@prisma/client';

// ---------------------------------------------------------------------------
// Shape expected by the Circle frontend
// ---------------------------------------------------------------------------
interface FamilyMemberView {
  id: string;
  name: string;
  relation: string;
  role: string;
  initials: string;
  status: 'on-track' | 'attention' | 'quiet';
  statusLine: string;
  sharesMedication: boolean;
  sharesWellness: boolean;
}

/** Maps a Prisma FamilyMember to the view shape the Circle page needs. */
function toMemberView(m: FamilyMember): FamilyMemberView {
  // Derive initials from name (up to 2 chars)
  const initials = m.name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Derive a readable status from the FamilyRole enum
  const status: FamilyMemberView['status'] =
    m.role === FamilyRole.CONNECTED ? 'on-track' :
    m.role === FamilyRole.OWNER     ? 'on-track' :
                                      'quiet';

  const statusLine =
    m.role === FamilyRole.CONNECTED
      ? 'Connected and sharing updates.'
      : m.role === FamilyRole.OWNER
        ? 'This is your account.'
        : 'Pending — invite not yet accepted.';

  return {
    id:               m.id,
    name:             m.name,
    relation:         m.relation,
    role:             m.role.toLowerCase(),
    initials,
    status,
    statusLine,
    sharesMedication: m.sharesMedication,
    sharesWellness:   m.sharesWellness,
  };
}

export const getFamilyMembers = async (userId: string) => {
  const members = await prisma.familyMember.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return members.map(toMemberView);
};

export const inviteFamilyMember = async (userId: string, email: string, relation: string) => {
  // In a real app, this would send an email and handle accept flow
  // We'll create it in a pending state, wait, the schema doesn't have a status.
  // We'll simulate the "accept" later. For now, it's just created.
  const newMember = await prisma.familyMember.create({
    data: {
      userId,
      name: email.split('@')[0], // placeholder name
      relation,
      role: FamilyRole.VIEWER,
      sharesMedication: true,
      sharesWellness: false,
    },
  });
  return newMember;
};

export const acceptInvitation = async (userId: string, memberId: string) => {
  const member = await prisma.familyMember.findUnique({ where: { id: memberId } });
  if (!member || member.userId !== userId) {
    return null;
  }

  return prisma.familyMember.update({
    where: { id: memberId },
    data: {
      role: FamilyRole.CONNECTED, // Moves them from viewer/pending to connected
    },
  });
};

export const updateRole = async (userId: string, memberId: string, role: FamilyRole) => {
  const member = await prisma.familyMember.findUnique({ where: { id: memberId } });
  if (!member || member.userId !== userId) {
    return null;
  }
  return prisma.familyMember.update({
    where: { id: memberId },
    data: { role },
  });
};

export const updatePermissions = async (
  userId: string,
  memberId: string,
  sharesMedication?: boolean,
  sharesWellness?: boolean,
) => {
  const member = await prisma.familyMember.findUnique({ where: { id: memberId } });
  if (!member || member.userId !== userId) {
    return null;
  }

  return prisma.familyMember.update({
    where: { id: memberId },
    data: {
      ...(sharesMedication !== undefined && { sharesMedication }),
      ...(sharesWellness !== undefined && { sharesWellness }),
    },
  });
};

export const removeFamilyMember = async (userId: string, memberId: string) => {
  const member = await prisma.familyMember.findUnique({ where: { id: memberId } });
  if (!member || member.userId !== userId) {
    return false;
  }

  await prisma.familyMember.delete({ where: { id: memberId } });
  return true;
};
