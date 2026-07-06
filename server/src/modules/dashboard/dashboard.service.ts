import { prisma } from '@/lib/prisma';
import { DoseStatus, DoseEvent, WaterLog } from '@prisma/client';

export const getSummary = async (userId: string) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Health Rings
  // Medication
  const todayDoses = await prisma.doseEvent.findMany({
    where: {
      medication: { userId },
      scheduledFor: { gte: startOfDay, lte: endOfDay },
    },
    include: { medication: true },
    orderBy: { scheduledFor: 'asc' },
  });

  const totalDoses = todayDoses.length;
  const takenDoses = todayDoses.filter((d: DoseEvent) => d.status === DoseStatus.TAKEN).length;

  // Hydration
  const waterLogs = await prisma.waterLog.findMany({
    where: {
      userId,
      recordedAt: { gte: startOfDay, lte: endOfDay },
    },
  });
  const totalWaterMl = waterLogs.reduce((acc: number, log: WaterLog) => acc + log.amountMl, 0);
  const glasses = Math.round(totalWaterMl / 250); // Assuming 1 glass = 250ml

  const healthRings = [
    {
      id: 'r1',
      label: 'Medication',
      value: takenDoses,
      goal: totalDoses || 4,
      unit: 'doses',
      color: 'primary',
    },
    { id: 'r2', label: 'Hydration', value: glasses, goal: 8, unit: 'glasses', color: 'info' },
    { id: 'r3', label: 'Habits', value: 3, goal: 5, unit: 'done', color: 'gold' }, // Mocked habits for now
  ];

  // 2. Family Health Score
  const familyScoreValue = Math.round((takenDoses / (totalDoses || 1)) * 100);
  const familyHealthScore = {
    score: familyScoreValue,
    label: familyScoreValue > 80 ? 'Strong' : familyScoreValue > 50 ? 'Fair' : 'Needs attention',
    delta: 'Updated today',
  };

  // 3. Next Dose
  const now = new Date();
  const upcomingDose = todayDoses.find(
    (d: DoseEvent) => d.status === DoseStatus.UPCOMING && d.scheduledFor >= now,
  );

  let nextDose = null;
  if (upcomingDose) {
    const timeDiffMs = upcomingDose.scheduledFor.getTime() - now.getTime();
    const hours = Math.floor(timeDiffMs / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    let inLabel = '';
    if (hours > 0) inLabel += `${hours}h `;
    inLabel += `${minutes}m`;

    nextDose = {
      medicationName: upcomingDose.medication.name,
      dosage: upcomingDose.medication.dosage,
      time: upcomingDose.scheduledFor.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      inLabel: `in ${inLabel}`,
      withFood: upcomingDose.medication.notes?.toLowerCase().includes('food') || false,
    };
  }

  // 4. Family Pulse
  const userMoodLogs = await prisma.wellnessMetric.findMany({
    where: {
      userId,
      label: 'Mood',
      recordedAt: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { recordedAt: 'desc' },
    take: 1,
  });

  let moodScore = 'okay';
  if (userMoodLogs.length > 0) {
    if (userMoodLogs[0].value > 7) moodScore = 'great';
    else if (userMoodLogs[0].value < 4) moodScore = 'low';
  }

  const familyMembers = await prisma.familyMember.findMany({
    where: { userId },
  });

  const familyPulse = [
    {
      id: 'p1',
      name: 'You',
      relation: 'Self',
      initials: 'YO',
      meds: takenDoses === totalDoses && totalDoses > 0 ? 'done' : 'due',
      hydration: Math.min(100, Math.round((glasses / 8) * 100)),
      mood: moodScore,
    },
    ...familyMembers.map((m: { id: string; name: string; relation: string }) => ({
      id: m.id,
      name: m.name,
      relation: m.relation,
      initials: m.name.charAt(0),
      meds: 'due', // Shared view would require fetching their stats if permissions allow
      hydration: 50,
      mood: 'okay',
    })),
  ];

  return {
    familyHealthScore,
    nextDose,
    familyPulse,
    healthRings,
  };
};

export const getAnalytics = async (userId: string) => {
  // Compute real analytics based on history.
  // For now, generating a realistic structure from database.
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const pastDoses = await prisma.doseEvent.findMany({
    where: {
      medication: { userId },
      scheduledFor: { gte: weekStart, lte: today },
    },
    include: { medication: true },
  });

  const adherenceWeek = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let totalTakenWeek = 0;
  let totalDueWeek = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dayLabel = days[d.getDay()];

    const dosesForDay = pastDoses.filter((dose) => {
      return (
        dose.scheduledFor.getDate() === d.getDate() && dose.scheduledFor.getMonth() === d.getMonth()
      );
    });

    // total is computed inline or in the UI if needed
    const taken = dosesForDay.filter((dose) => dose.status === 'TAKEN').length;

    totalDueWeek += dosesForDay.length;
    totalTakenWeek += taken;

    adherenceWeek.push({ day: dayLabel, total: dosesForDay.length || 1, taken });
  }

  const adherencePercent =
    totalDueWeek > 0 ? Math.round((totalTakenWeek / totalDueWeek) * 100) : 100;

  return {
    stats: [
      {
        icon: 'Target',
        label: 'Weekly adherence',
        value: `${adherencePercent}%`,
        sub: '+0% vs last week',
        chip: 'bg-primary/12 text-primary',
      },
      {
        icon: 'Flame',
        label: 'Current streak',
        value: '3 days',
        sub: 'Longest: 3 days',
        chip: 'bg-warning/20 text-warning-foreground',
      },
      {
        icon: 'Droplets',
        label: 'Hydration',
        value: '4 / 8',
        sub: 'glasses · daily avg',
        chip: 'bg-info/15 text-info',
      },
      {
        icon: 'TrendingUp',
        label: 'Sleep',
        value: '7.2h',
        sub: 'trending steady',
        chip: 'bg-accent/20 text-accent-foreground',
      },
    ],
    adherenceWeek,
  };
};
