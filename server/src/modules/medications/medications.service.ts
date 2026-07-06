import { prisma } from '../../lib/prisma';
import { DoseStatus, MedicationForm, Medication, DoseEvent, Prisma } from '@prisma/client';

export const createMedication = async (
  userId: string,
  data: {
    name: string;
    dosage: string;
    form?: string;
    critical?: boolean;
    color?: string;
    notes?: string;
    refillIn?: number;
    schedule?: string;
    times?: string[];
  },
) => {
  const { name, dosage, form, critical, color, notes, refillIn, schedule, times } = data;

  // Transaction to create med, schedule, and initial doses
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const med = await tx.medication.create({
      data: {
        userId,
        name,
        dosage,
        form: form ? (form.toUpperCase() as MedicationForm) : MedicationForm.PILL,
        critical: critical || false,
        color,
        notes,
        refillIn,
      },
    });

    const frequency = schedule || 'Once daily';

    if (times && Array.isArray(times) && times.length > 0) {
      // Batch create schedules
      await tx.medicationSchedule.createMany({
        data: times.map((t) => ({
          medicationId: med.id,
          time: t,
          frequency,
        })),
      });

      // Batch create doses for the next 30 days
      const doseData = [];
      for (const t of times) {
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          const [hours, minutes] = t.split(':').map(Number);
          date.setHours(hours, minutes, 0, 0);

          doseData.push({
            medicationId: med.id,
            scheduledFor: date,
            status: DoseStatus.UPCOMING,
          });
        }
      }

      await tx.doseEvent.createMany({
        data: doseData,
      });
    }

    return mapToFrontendMedication(med, schedule, times);
  });
};

export const getMedications = async (userId: string, page: number, limit: number) => {
  limit = Math.max(1, Math.min(limit, 100));
  page = Math.max(1, page);
  const skip = (page - 1) * limit;

  const [totalCount, meds] = await Promise.all([
    prisma.medication.count({ where: { userId } }),
    prisma.medication.findMany({
      where: { userId },
      include: { schedules: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const data = meds.map((med) => {
    const schedule = med.schedules.length > 0 ? med.schedules[0].frequency : 'Custom';
    const times = med.schedules.map((s) => s.time);
    return mapToFrontendMedication(med, schedule, times);
  });

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

export const getTodayDoses = async (userId: string) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const doses = await prisma.doseEvent.findMany({
    where: {
      medication: { userId },
      scheduledFor: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: { medication: true },
    orderBy: { scheduledFor: 'asc' },
  });

  return doses.map(mapToFrontendDose);
};

export const updateDoseStatus = async (userId: string, doseId: string, statusStr: string) => {
  // Validate ownership first
  const existingDose = await prisma.doseEvent.findUnique({
    where: { id: doseId },
    include: { medication: true },
  });

  if (!existingDose || existingDose.medication.userId !== userId) {
    return null; // Not found or forbidden
  }

  let mappedStatus: DoseStatus = DoseStatus.UPCOMING;
  const s = statusStr.toUpperCase();
  if (Object.values(DoseStatus).includes(s as DoseStatus)) {
    mappedStatus = s as DoseStatus;
  }

  const updatedDose = await prisma.doseEvent.update({
    where: { id: doseId },
    data: {
      status: mappedStatus,
      takenAt: mappedStatus === DoseStatus.TAKEN ? new Date() : null,
    },
    include: { medication: true },
  });

  return mapToFrontendDose(updatedDose);
};

export const deleteMedication = async (userId: string, medicationId: string) => {
  const med = await prisma.medication.findUnique({ where: { id: medicationId } });
  if (!med || med.userId !== userId) return false;

  await prisma.medication.delete({
    where: { id: medicationId },
  });

  return true;
};

// --- Mappers ---

function mapToFrontendMedication(med: Medication, scheduleStr?: string, timesArr?: string[]) {
  return {
    id: med.id,
    name: med.name,
    dosage: med.dosage,
    form: med.form ? med.form.charAt(0) + med.form.slice(1).toLowerCase() : 'Tablet',
    schedule: scheduleStr || 'Once daily',
    times: timesArr || [],
    critical: med.critical,
    notes: med.notes || undefined,
    refillIn: med.refillIn || undefined,
    color: med.color || 'var(--color-primary)',
  };
}

function mapToFrontendDose(dose: DoseEvent & { medication: Medication }) {
  const time = new Date(dose.scheduledFor).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // map Prisma DoseStatus to frontend DoseStatus string ("taken", "skipped", "upcoming", "due")
  let status = dose.status.toLowerCase() as string;
  if (status === 'upcoming') {
    // Determine if due
    if (new Date(dose.scheduledFor) <= new Date()) {
      status = 'due';
    }
  }

  return {
    id: dose.id,
    medicationId: dose.medication.id,
    medicationName: dose.medication.name,
    dosage: dose.medication.dosage,
    time,
    status,
    critical: dose.medication.critical,
  };
}
