const nodemailer = require('nodemailer');
const { emailConfiguration } = require('./configuration');
function createMailer({ env = () => process.env, createTransport = options => nodemailer.createTransport(options) } = {}) {
  async function use(action) {
    const mailer = createTransport(emailConfiguration(env()).transport);
    try { return await action(mailer); } finally { mailer.close(); }
  }
  return { sendMail: options => use(mailer => mailer.sendMail(options)), verify: () => use(mailer => mailer.verify()) };
}
module.exports = createMailer();
module.exports.createMailer = createMailer;
