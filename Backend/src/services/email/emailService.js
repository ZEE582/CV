/**
 * @fileoverview Email Service
 * @description Sends transactional emails such as verification codes.
 *
 * @module services/email/emailService
 */

import { sendWithRetry } from "./retry.js";
import { verificationCodeTemplate } from "./templates.js";

export async function sendVerificationCode(email, code) {
  const mailOptions = {
    from: `"ttwar تتطور" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "كود التحقق — ttwar",
    html: verificationCodeTemplate(code),
  };

  await sendWithRetry(mailOptions);
}