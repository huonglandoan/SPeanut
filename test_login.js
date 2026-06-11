const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Parse .env.local manually
const envContent = fs.readFileSync('./.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing logins against URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- ADMIN LOGIN ---');
  const { data: dataAdmin, error: errorAdmin } = await supabase.auth.signInWithPassword({
    email: 'admin@speanut.com',
    password: '111111'
  });
  if (errorAdmin) {
    console.error('ADMIN FAIL:', errorAdmin.message);
  } else {
    console.log('ADMIN SUCCESS! Logged in as:', dataAdmin.user.email);
  }

  console.log('--- USER LOGIN ---');
  const { data: dataUser, error: errorUser } = await supabase.auth.signInWithPassword({
    email: 'user@speanut.com',
    password: '123456'
  });
  if (errorUser) {
    console.error('USER FAIL:', errorUser.message);
  } else {
    console.log('USER SUCCESS! Logged in as:', dataUser.user.email);
  }
}

run();
