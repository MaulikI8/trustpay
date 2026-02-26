try {
  require('dotenv').config();
  const app = require('../src/app');
  require('../src/config/supabase');
  module.exports = app;
} catch (e) {
  console.error("Vercel Boot Error", e);
  module.exports = (req, res) => {
    res.status(500).send(`Vercel Boot Crash: ${e.message}\n\n${e.stack}`);
  };
}
