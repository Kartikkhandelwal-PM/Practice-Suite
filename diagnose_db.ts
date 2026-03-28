
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('Checking user_tokens table...');
  const { data, error } = await supabase.from('user_tokens').select('*');
  if (error) {
    console.error('Error fetching user_tokens:', error);
  } else {
    console.log(`Found ${data.length} tokens`);
    data.forEach(t => {
      console.log(`User: ${t.user_id}, Provider: ${t.provider}, Email: ${t.email}`);
    });
  }

  console.log('\nChecking emails table...');
  const { data: emails, error: emailError } = await supabase.from('emails').select('id, subject, from_name').limit(5);
  if (emailError) {
    console.error('Error fetching emails:', emailError);
  } else {
    console.log(`Found ${emails.length} emails (limited to 5)`);
    emails.forEach(e => {
      console.log(`ID: ${e.id}, Subject: ${e.subject}, From: ${e.from_name}`);
    });
  }
}

check();
