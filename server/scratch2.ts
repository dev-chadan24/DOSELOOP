import { z } from 'zod';

const createEmergencyContactSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    relation: z.string().min(1, 'Relation is required'),
    phone: z.string().min(1, 'Phone is required'),
    isPrimary: z.boolean().optional(),
  }),
});

async function run() {
  try {
    const res = await createEmergencyContactSchema.parseAsync({
      body: { name: 'Test', relation: 'Friend', phone: '123' },
      query: {},
      params: {},
    });
    console.log("SUCCESS emergency", res);
  } catch (e) {
    console.error("FAIL emergency", e);
  }
}

run();
