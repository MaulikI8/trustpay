const { config } = require('dotenv');
const path = require('path');

config({ path: path.resolve(__dirname, '../../.env') });

const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  SUPABASE: {
    URL: process.env.SUPABASE_URL,
    KEY: process.env.SUPABASE_ANON_KEY,
  },
  
  JWT: {
    SECRET: process.env.JWT_SECRET,
    EXPIRES_IN: '7d',
  },
  
  EMAIL: {
    HOST: 'smtp.gmail.com',
    PORT: 587,
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS,
  }
};

if (!ENV.SUPABASE.URL || !ENV.SUPABASE.KEY) {
  console.error('❌ FATAL ERROR: Supabase variables are missing! Check your .env path.');
  process.exit(1);
}

module.exports = ENV;