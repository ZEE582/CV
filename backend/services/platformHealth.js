const mongoose = require('mongoose');

function createHealthChecks({ connection = mongoose.connection, timeoutMS = 1000 } = {}) {
  let pending;
  async function probe() {
    if (connection.readyState !== 1 || !connection.db) return false;
    let timer;
    try {
      const result = await Promise.race([
        connection.db.command({ ping: 1 }, { timeoutMS }),
        new Promise(resolve => { timer = setTimeout(() => resolve(null), timeoutMS); }),
      ]);
      return result?.ok === 1 && connection.readyState === 1;
    } catch { return false; }
    finally { clearTimeout(timer); }
  }
  return {
    live(_req, res) { res.set('Cache-Control', 'no-store').json({ success: true, status: 'alive' }); },
    async ready(_req, res) {
      // Share a pending ping; never cache a successful result across completed probes.
      if (!pending) pending = probe().finally(() => { pending = null; });
      const connected = await pending;
      res.set('Cache-Control', 'no-store').status(connected ? 200 : 503).json({ success: connected, database: connected ? 'connected' : 'disconnected' });
    },
  };
}
module.exports = { createHealthChecks };
