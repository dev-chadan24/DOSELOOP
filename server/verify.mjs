import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hvduagntoflynubyaqxs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ZHVhZ250b2ZseW51YnlhcXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjg5OTQxOCwiZXhwIjoyMDk4NDc1NDE4fQ.QrResU7a97u7P5elHRRKTMQFrNMJ8fQ6gHIqdRYXPCw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  console.log('--- Starting API Verification ---');
  
  // 1. Create/Auth test user
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  console.log(`Creating test user: ${email}`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (authError) {
    console.error('Failed to create user:', authError);
    process.exit(1);
  }
  
  const userId = authData.user.id;
  
  // Create user in Prisma DB to satisfy foreign keys
  const prisma = new PrismaClient();
  await prisma.user.create({
    data: {
      id: userId,
      email,
      firstName: 'Test',
      lastName: 'User',
      plan: 'free',
    }
  });
  
  // Sign in to get JWT
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (signInError) {
    console.error('Failed to sign in:', signInError);
    process.exit(1);
  }
  
  const token = signInData.session.access_token;
  console.log('Successfully authenticated. Token acquired.');

  const API_BASE = 'http://localhost:5000/api/v1';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {

    // Test 1: Circle Page (GET /family)
    console.log('\n[Test 1] Fetching Circle Family Members...');
    const familyRes = await fetch(`${API_BASE}/family`, { headers });
    const familyJson = await familyRes.json();
    console.log('Family Response:', JSON.stringify(familyJson, null, 2));
    if (familyRes.ok && familyJson.success) {
      // The array items should have status, statusLine, initials
      const members = familyJson.data;
      if (members.length === 0 || members.every(m => m.status && m.statusLine)) {
         console.log('✅ Circle GET /family fixed successfully (fields are mapped).');
      } else {
         console.error('❌ Circle Fields missing in response:', members[0]);
      }
    } else {
      console.error('❌ Family fetch failed:', familyJson);
    }

    // Test 2: AI Assistant (POST /ai/chat)
    console.log('\n[Test 2] Testing AI Assistant Chat...');
    const aiRes = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: 'Hello, how can I use DoseLoop?' })
    });
    const aiJson = await aiRes.json();
    console.log('AI Response:', JSON.stringify(aiJson, null, 2));
    if (aiRes.ok && aiJson.success) {
      if (aiJson.data.message) {
        console.log('✅ AI Assistant chat fixed successfully (returns valid message string).');
      } else {
        console.error('❌ AI Assistant response missing data.message');
      }
    } else {
      console.error('❌ AI request failed:', aiJson);
    }

    // Test 3: Emergency SOS (POST /emergency/sos)
    console.log('\n[Test 3] Testing Emergency SOS...');
    const sosRes = await fetch(`${API_BASE}/emergency/sos`, {
      method: 'POST',
      headers,
    });
    const sosJson = await sosRes.json();
    console.log('SOS Response:', JSON.stringify(sosJson, null, 2));
    if (sosRes.ok && sosJson.success) {
      if (sosJson.data && sosJson.data.success && typeof sosJson.data.contactsNotified === 'number') {
        console.log(`✅ Emergency SOS fixed successfully (notified ${sosJson.data.contactsNotified} contacts).`);
      } else {
        console.error('❌ Emergency SOS response missing expected contactsNotified number field:', sosJson.data);
      }
    } else {
      console.error('❌ SOS request failed:', sosJson);
    }

  } catch (err) {
    console.error('Error during API tests:', err);
  } finally {
    // Clean up
    console.log(`\nCleaning up user ${userId}`);
    await prisma.user.delete({ where: { id: userId } });
    await supabase.auth.admin.deleteUser(userId);
    await prisma.$disconnect();
  }
}

run();
