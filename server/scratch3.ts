import { z } from 'zod';

const paginationSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform(Number).pipe(z.number().int().min(1)),
    limit: z.string().optional().default('50').transform(Number).pipe(z.number().int().min(1).max(100)),
  }),
});

async function run() {
  try {
    const query = Object.create(null);
    query.page = "1";
    
    const res = await paginationSchema.parseAsync({
      body: {},
      query: query,
      params: {},
    });
    console.log("SUCCESS", res);
  } catch (e) {
    console.error("FAIL", e);
  }
}

run();
