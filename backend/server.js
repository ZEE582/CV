require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { createApp } = require('./app');
async function start() {
  await connectDB();
  const app = createApp();
  const server = app.listen(Number(process.env.PORT || 5000), () => console.log('Ttwar API listening on port ' + (process.env.PORT || 5000)));
  async function shutdown() { server.close(async () => { await app.locals.sessionStore?.close?.(); await mongoose.disconnect(); process.exit(0); }); }
  process.once('SIGINT', shutdown); process.once('SIGTERM', shutdown);
  return server;
}
if (require.main === module) start().catch(() => { console.error('Startup failed. Check MongoDB, JWT_SECRET, and backend/.env.'); process.exitCode = 1; });
module.exports = { start };
