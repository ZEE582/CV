const path = require('node:path');
const { emailConfiguration } = require('../backend/modules/auth/services/email/configuration');
const { emailFailure } = require('../backend/modules/auth/services/email/failure');
const transporter = require('../backend/modules/auth/services/email/transporter');

async function inspectEmail({ env = process.env, connect = false, verify = () => transporter.createMailer({ env: () => env }).verify() } = {}) {
  let config;
  try { config = emailConfiguration(env); }
  catch (error) { return { configured: false, connectionChecked: false, verified: false, reason: emailFailure(error), fields: error.fields || [] }; }
  const report = { configured: true, connectionChecked: false, verified: false, reason: 'not_checked', encryption: config.transport.secure ? 'TLS' : 'STARTTLS_required' };
  if (!connect) return report;
  report.connectionChecked = true;
  try { if (await verify() !== true) throw new Error('Email verification not confirmed'); report.verified = true; report.reason = 'connection_verified'; }
  catch (error) { report.reason = emailFailure(error); }
  return report;
}
async function main(args = process.argv.slice(2)) {
  if (args.length > 1 || args.some(arg => arg !== '--connect')) {
    console.error('Usage: npm run check:email -- [--connect]'); return 1;
  }
  require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env'), quiet: true });
  const report = await inspectEmail({ connect: args.includes('--connect') });
  console.log(JSON.stringify(report, null, 2));
  return report.configured && (!report.connectionChecked || report.verified) ? 0 : 2;
}
module.exports = { inspectEmail, main };
if (require.main === module) main().then(code => { process.exitCode = code; }).catch(() => { console.error('Email diagnostic failed. Check the local configuration.'); process.exitCode = 1; });
