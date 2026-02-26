const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ FATAL ERROR: Supabase environment variables are missing on Vercel boot!');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
  (async () => {
    try {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
      console.log('✅ Database connected: Supabase is online and ready.');
    } catch (err) {
      console.error('❌ Database connection failed:', err.message);
    }
  })();
}

module.exports = supabase;