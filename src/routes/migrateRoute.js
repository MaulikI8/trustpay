const express = require('express');
const router = express.Router();
const { Client } = require('pg');
require('dotenv').config();

const PROJECT_REF = 'hiqydabuatwkjopudryo';

router.get('/drop-fk', async (req, res) => {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!dbPassword || dbPassword === 'YOUR_DB_PASSWORD_HERE') {
    return res.status(400).json({
      status: 'error',
      message: '❌ SUPABASE_DB_PASSWORD not set in .env',
      help: `Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database — copy your DB password, paste into .env as SUPABASE_DB_PASSWORD=yourpassword, then restart the server and hit this endpoint again.`
    });
  }

  const client = new Client({
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: dbPassword,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(`
      -- Drop the bad FK constraint that references auth.users
      ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS fk_wallet_user;
      ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;

      -- Make user_id nullable (we don't need it since wallet_id = fonepay_id)
      ALTER TABLE public.wallets ALTER COLUMN user_id DROP NOT NULL;

      -- Add missing columns if they don't exist yet
      ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS offline_reserved decimal(12,2) DEFAULT 0;
      ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS offline_used decimal(12,2) DEFAULT 0;
      ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'PENDING';
      ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS public_key text;

      -- Create offline_transactions table if missing
      CREATE TABLE IF NOT EXISTS public.offline_transactions (
        txn_id      text PRIMARY KEY,
        from_wallet text NOT NULL,
        to_wallet   text NOT NULL,
        amount      decimal(12,2) NOT NULL,
        signature   text NOT NULL,
        status      text DEFAULT 'SETTLED',
        is_offline  boolean DEFAULT true,
        created_at  timestamptz DEFAULT now()
      );

      ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.offline_transactions DISABLE ROW LEVEL SECURITY;
    `);

    await client.end();

    return res.status(200).json({
      status: 'success',
      message: '✅ Fixed! FK constraint dropped. Now register a new user — wallet will be auto-created correctly.'
    });

  } catch (err) {
    try { await client.end(); } catch (_) {}
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { db_password } = req.body;

  if (!db_password) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing db_password in request body',
      help: 'Find your password at: https://supabase.com/dashboard/project/' + PROJECT_REF + '/settings/database'
    });
  }

  const client = new Client({
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: db_password,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- ✅ Users table (create if not exists)
      CREATE TABLE IF NOT EXISTS public.users (
        id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        full_name       text NOT NULL,
        email           text UNIQUE NOT NULL,
        phone           text UNIQUE NOT NULL,
        security_pin    text NOT NULL,
        fonepay_id      text UNIQUE NOT NULL,
        trust_score     int DEFAULT 75,
        created_at      timestamptz DEFAULT now()
      );

      -- Add missing columns to users (safe, won't fail if column exists)
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name text;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS security_pin text;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fonepay_id text UNIQUE;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS trust_score int DEFAULT 75;

      -- ✅ Wallets table (wallet_id = fonepay_id, no user_id FK to avoid auth.users conflict)
      CREATE TABLE IF NOT EXISTS public.wallets (
        wallet_id         text PRIMARY KEY,
        balance           decimal(12,2) DEFAULT 0,
        offline_reserved  decimal(12,2) DEFAULT 0,
        offline_used      decimal(12,2) DEFAULT 0,
        kyc_status        text DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
        public_key        text,
        created_at        timestamptz DEFAULT now()
      );

      -- Add missing columns to wallets (safe)
      ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS offline_reserved decimal(12,2) DEFAULT 0;
      ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS offline_used decimal(12,2) DEFAULT 0;
      ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'PENDING';
      ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS public_key text;
      -- Drop conflicting FK if it exists
      ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS fk_wallet_user;
      ALTER TABLE public.wallets DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;
      ALTER TABLE public.wallets DROP COLUMN IF EXISTS user_id;

      -- ✅ Online transactions table
      CREATE TABLE IF NOT EXISTS public.transactions (
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

      -- ✅ Offline transactions table
      CREATE TABLE IF NOT EXISTS public.offline_transactions (
        txn_id       text PRIMARY KEY,
        from_wallet  text REFERENCES public.wallets(wallet_id) NOT NULL,
        to_wallet    text REFERENCES public.wallets(wallet_id) NOT NULL,
        amount       decimal(12,2) NOT NULL CHECK (amount > 0),
        signature    text NOT NULL,
        status       text DEFAULT 'SETTLED',
        is_offline   boolean DEFAULT true,
        created_at   timestamptz DEFAULT now()
      );

      -- Disable RLS for development
      ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE public.offline_transactions DISABLE ROW LEVEL SECURITY;
    `);

    await client.end();

    return res.status(200).json({
      status: 'success',
      message: '✅ Migration complete! All tables and columns are up to date. Test /api/v1/auth/register now.'
    });

  } catch (err) {
    try { await client.end(); } catch (_) {}

    if (err.message.includes('password authentication failed')) {
      return res.status(401).json({
        status: 'error',
        message: 'Wrong database password',
        help: 'Find correct password at: https://supabase.com/dashboard/project/' + PROJECT_REF + '/settings/database'
      });
    }

    return res.status(500).json({ status: 'error', message: err.message });
  }
});

const supabase = require('../config/supabase');

router.post('/fix-wallet', async (req, res) => {
  const { fonepay_id } = req.body;

  if (!fonepay_id) {
    return res.status(400).json({ status: 'error', message: 'Missing fonepay_id' });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, fonepay_id')
    .eq('fonepay_id', fonepay_id)
    .maybeSingle();

  if (userError) return res.status(500).json({ status: 'error', message: userError.message });
  if (!user) return res.status(404).json({ status: 'error', message: `No user found with fonepay_id: ${fonepay_id}` });

  const { error: walletError } = await supabase
    .from('wallets')
    .upsert([{
      wallet_id: fonepay_id,
      balance: 10000,
      offline_reserved: 0,
      offline_used: 0,
      kyc_status: 'VERIFIED'
    }], { onConflict: 'wallet_id' });

  if (walletError) return res.status(500).json({ status: 'error', message: walletError.message });

  return res.status(200).json({
    status: 'success',
    message: `✅ Wallet created/updated for ${fonepay_id} with balance 10,000. You can now use /api/v1/qr/reserve`
  });
});

router.post('/topup', async (req, res) => {
  const { wallet_id, amount = 10000 } = req.body;

  if (!wallet_id) {
    return res.status(400).json({ status: 'error', message: 'Missing wallet_id' });
  }

  const { data: wallet, error: fetchErr } = await supabase
    .from('wallets')
    .select('balance')
    .eq('wallet_id', wallet_id)
    .maybeSingle();

  if (fetchErr) return res.status(500).json({ status: 'error', message: fetchErr.message });
  if (!wallet) return res.status(404).json({ status: 'error', message: `Wallet not found: ${wallet_id}` });

  const newBalance = (wallet.balance || 0) + amount;

  const { error: updateErr } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('wallet_id', wallet_id);

  if (updateErr) return res.status(500).json({ status: 'error', message: updateErr.message });

  return res.status(200).json({
    status: 'success',
    message: `✅ Topped up ${amount} NPR to ${wallet_id}`,
    data: { wallet_id, new_balance: newBalance }
  });
});

module.exports = router;
