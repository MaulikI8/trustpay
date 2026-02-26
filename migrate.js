

const { Client } = require('pg');

const DB_PASSWORD = process.argv[2];
const PROJECT_REF = 'hiqydabuatwkjopudryo';

if (!DB_PASSWORD) {
  console.log('\n❌ Missing database password!\n');
  console.log('How to find it:');
  console.log('  1. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF + '/settings/database');
  console.log('  2. Under "Connection string", find "Password" and click "Reset database password" if needed');
  console.log('  3. Then run: node migrate.js YOUR_PASSWORD\n');
  process.exit(1);
}

async function migrate() {
  const client = new Client({
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n⏳ Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('⏳ Running migration...\n');

    await client.query(`
      -- Remove old tables
      DROP TABLE IF EXISTS public.money_path_events CASCADE;
      DROP TABLE IF EXISTS public.transactions CASCADE;
      DROP TABLE IF EXISTS public.users CASCADE;

      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Create users table with correct columns
      CREATE TABLE public.users (
        id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        fullname    text NOT NULL,
        email       text UNIQUE NOT NULL,
        phone       text UNIQUE NOT NULL,
        tpin_hash   text NOT NULL,
        trust_score int DEFAULT 75,
        kyc_status  text DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
        created_at  timestamptz DEFAULT now()
      );

      -- Create transactions table
      CREATE TABLE public.transactions (
        id             uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        sender_id      uuid REFERENCES public.users(id) NOT NULL,
        recipient_id   uuid NOT NULL,
        recipient_type text NOT NULL CHECK (recipient_type IN ('USER', 'MERCHANT')),
        amount         decimal(12,2) NOT NULL CHECK (amount > 0),
        currency       text DEFAULT 'NPR' NOT NULL,
        status         text NOT NULL CHECK (status IN ('CREATED','PROCESSING','SETTLED','FAILED','REVERSED')) DEFAULT 'CREATED',
        category       text,
        note           text,
        created_at     timestamptz DEFAULT now()
      );

      -- Disable RLS (backend manages access via JWT)
      ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
    `);

    console.log('✅ Migration successful! Tables created:');
    console.log('   • users (id, fullname, email, phone, tpin_hash, trust_score, kyc_status, created_at)');
    console.log('   • transactions');
    console.log('\n👉 Now restart your server and test the register endpoint!\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    if (err.message.includes('password authentication failed')) {
      console.log('\n💡 Wrong password. Find the correct one at:');
      console.log('   https://supabase.com/dashboard/project/' + PROJECT_REF + '/settings/database\n');
    }
  } finally {
    await client.end();
  }
}

migrate();
