import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from './src/config/env';

const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No users found");
    return;
  }
  
  // Note: Supabase uses JWT_SECRET for signing, but it expects specific claims (sub, aud).
  // Actually, wait, Supabase signs JWTs. The backend verifies them with SUPABASE_JWT_SECRET or similar.
  // In `auth.middleware.ts`, how is the token verified? Let's check `auth.middleware.ts`.
}
test();
