'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const client_1 = require('@prisma/client');
const bcryptjs_1 = __importDefault(require('bcryptjs'));
const prisma = new client_1.PrismaClient();
async function main() {
  const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'ayush.iyer@doseloop.app' },
    update: {},
    create: {
      email: 'ayush.iyer@doseloop.app',
      password: hashedPassword,
      name: 'Ayush Iyer',
      firstName: 'Ayush',
      initials: 'AY',
      plan: 'Self-managing patient',
    },
  });
  console.log(`Created test user: ${user.email}`);
  // Medications
  const meds = [
    {
      id: 'm1',
      name: 'Lisinopril',
      dosage: '10 mg',
      form: 'Tablet',
      schedule: 'Once daily · Morning',
      times: ['08:00'],
      critical: true,
      notes: 'Take with water, before breakfast.',
      refillIn: 6,
      color: 'var(--color-primary)',
      userId: user.id,
    },
    {
      id: 'm2',
      name: 'Metformin',
      dosage: '500 mg',
      form: 'Tablet',
      schedule: 'Twice daily · With meals',
      times: ['08:00', '20:00'],
      critical: true,
      notes: 'With food to reduce stomach upset.',
      refillIn: 12,
      color: 'var(--color-success)',
      userId: user.id,
    },
    {
      id: 'm3',
      name: 'Atorvastatin',
      dosage: '20 mg',
      form: 'Tablet',
      schedule: 'Once daily · Evening',
      times: ['20:00'],
      critical: false,
      notes: 'Take at bedtime.',
      refillIn: 21,
      color: 'var(--color-info)',
      userId: user.id,
    },
    {
      id: 'm4',
      name: 'Vitamin D3',
      dosage: '2000 IU',
      form: 'Softgel',
      schedule: 'Once daily · Morning',
      times: ['08:00'],
      critical: false,
      notes: null,
      refillIn: 30,
      color: 'var(--color-warning)',
      userId: user.id,
    },
  ];
  for (const med of meds) {
    await prisma.medication.upsert({
      where: { id: med.id },
      update: {},
      create: med,
    });
  }
  console.log(`Created ${meds.length} medications`);
  // Doses
  const doses = [
    {
      id: 'd1',
      medicationId: 'm1',
      medicationName: 'Lisinopril',
      dosage: '10 mg',
      time: '08:00',
      status: 'taken',
      critical: true,
    },
    {
      id: 'd2',
      medicationId: 'm2',
      medicationName: 'Metformin',
      dosage: '500 mg',
      time: '08:00',
      status: 'taken',
      critical: true,
    },
    {
      id: 'd3',
      medicationId: 'm4',
      medicationName: 'Vitamin D3',
      dosage: '2000 IU',
      time: '08:00',
      status: 'skipped',
      critical: false,
    },
    {
      id: 'd4',
      medicationId: 'm2',
      medicationName: 'Metformin',
      dosage: '500 mg',
      time: '20:00',
      status: 'due',
      critical: true,
    },
    {
      id: 'd5',
      medicationId: 'm3',
      medicationName: 'Atorvastatin',
      dosage: '20 mg',
      time: '20:00',
      status: 'upcoming',
      critical: false,
    },
  ];
  for (const dose of doses) {
    await prisma.doseEvent.upsert({
      where: { id: dose.id },
      update: {},
      create: dose,
    });
  }
  console.log(`Created ${doses.length} dose events`);
  // Wellness
  const wellness = [
    {
      id: 'w1',
      label: 'Water',
      icon: 'Droplets',
      value: 5,
      goal: 8,
      unit: 'glasses',
      tone: 'info',
      userId: user.id,
    },
    {
      id: 'w2',
      label: 'Sleep',
      icon: 'Moon',
      value: 7.2,
      goal: 8,
      unit: 'hours',
      tone: 'primary',
      userId: user.id,
    },
    {
      id: 'w3',
      label: 'Mood',
      icon: 'Smile',
      value: 4,
      goal: 5,
      unit: '/ 5',
      tone: 'accent',
      userId: user.id,
    },
    {
      id: 'w4',
      label: 'Steps',
      icon: 'Footprints',
      value: 4200,
      goal: 6000,
      unit: 'steps',
      tone: 'success',
      userId: user.id,
    },
  ];
  for (const well of wellness) {
    await prisma.wellnessMetric.upsert({
      where: { id: well.id },
      update: {},
      create: well,
    });
  }
  console.log(`Created ${wellness.length} wellness metrics`);
  // Circle Members
  const circleMembers = [
    {
      id: 'c1',
      name: 'Ananya Iyer',
      relation: 'Daughter',
      initials: 'AI',
      role: 'connected',
      status: 'on-track',
      statusLine: 'Watching over Dad · notified of missed critical doses',
      sharesMedication: true,
      sharesWellness: false,
      lastActive: 'Active 2h ago',
      userId: user.id,
    },
    {
      id: 'c2',
      name: 'Sunita Iyer',
      relation: 'Wife',
      initials: 'SI',
      role: 'owner',
      status: 'attention',
      statusLine: 'Missed her morning dose — a gentle check-in may help',
      sharesMedication: true,
      sharesWellness: true,
      lastActive: 'Active 5h ago',
      userId: user.id,
    },
    {
      id: 'c3',
      name: 'Rohan Iyer',
      relation: 'Son',
      initials: 'RI',
      role: 'owner',
      status: 'quiet',
      statusLine: 'On track this week · sharing wellness only',
      sharesMedication: false,
      sharesWellness: true,
      lastActive: 'Active yesterday',
      userId: user.id,
    },
  ];
  for (const cm of circleMembers) {
    await prisma.circleMember.upsert({
      where: { id: cm.id },
      update: {},
      create: cm,
    });
  }
  console.log(`Created ${circleMembers.length} circle members`);
  // Notifications
  const notifications = [
    {
      id: 'n1',
      title: 'Metformin is due',
      body: 'Your 8:00 PM dose with dinner. Tap to log when ready.',
      time: 'Just now',
      tone: 'reminder',
      unread: true,
      userId: user.id,
    },
    {
      id: 'n2',
      title: 'Vitamin D3 was skipped',
      body: 'No worries — one missed dose happens. We logged it quietly.',
      time: '9:12 AM',
      tone: 'gentle',
      unread: true,
      userId: user.id,
    },
    {
      id: 'n3',
      title: 'Your daily digest is ready',
      body: "You're on track today. 2 of 4 doses logged, hydration a little behind.",
      time: '8:00 AM',
      tone: 'digest',
      unread: false,
      userId: user.id,
    },
    {
      id: 'n4',
      title: 'Ananya joined your Circle',
      body: "Ananya can now see your medication status. You control what's shared.",
      time: 'Yesterday',
      tone: 'circle',
      unread: false,
      userId: user.id,
    },
  ];
  for (const notif of notifications) {
    await prisma.notification.upsert({
      where: { id: notif.id },
      update: {},
      create: notif,
    });
  }
  console.log(`Created ${notifications.length} notifications`);
  // Chat History
  const chatHistory = [
    {
      id: 'a1',
      role: 'assistant',
      content:
        "Good evening, Ayush. You've taken 2 of 4 doses today and your blood-pressure medication is on schedule. One Metformin dose is coming up at 8:00 PM. Anything you'd like to review?",
      userId: user.id,
    },
    { id: 'a2', role: 'user', content: 'How did I do this week?', userId: user.id },
    {
      id: 'a3',
      role: 'assistant',
      content:
        "This week you logged 31 of 35 scheduled doses — that's 89% adherence, slightly up from last week. Friday was your only lighter day. Your hydration averaged 6 of 8 glasses. Would you like a tip to make evening doses easier to remember?",
      userId: user.id,
    },
  ];
  for (const chat of chatHistory) {
    await prisma.chatMessage.upsert({
      where: { id: chat.id },
      update: {},
      create: chat,
    });
  }
  console.log(`Created ${chatHistory.length} chat messages`);
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
