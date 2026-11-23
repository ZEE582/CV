/**
 * @fileoverview Email Retry Helper
 * @description Sends email with retry support for temporary SMTP failures.
 *
 * @module services/email/retry
 */

const transporter = require("./transporter.js");
const { emailFailure, retryableEmailFailure } = require('./failure');

async function sendWithRetry(mailOptions, retries = 3, { send = options => transporter.sendMail(options), wait = ms => new Promise(resolve => setTimeout(resolve, ms)), warn = message => console.warn(message) } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await send(mailOptions);
      if (result?.rejected?.length) { const error = new Error('Email recipient rejected'); error.code = 'ERECIPIENT'; throw error; }
      return;
    } catch (error) {
      warn(
        `Email attempt ${attempt}/${retries} failed: ${emailFailure(error)}`
      );

      if (attempt === retries || !retryableEmailFailure(error)) {
        throw error;
      }

      await wait(2000);
    }
  }
}
module.exports = { sendWithRetry };
