/**
 * @fileoverview Email Retry Helper
 * @description Sends email with retry support for temporary SMTP failures.
 *
 * @module services/email/retry
 */

import transporter from "./transporter.js";

export async function sendWithRetry(mailOptions, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      return;
    } catch (error) {
      console.warn(
        `Email attempt ${attempt}/${retries} failed: ${error.message}`
      );

      if (attempt === retries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}