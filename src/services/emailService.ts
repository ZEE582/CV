/**
 * @fileoverview Email Service
 * @description Sends transactional emails via Gmail using nodemailer.
 *
 *              Currently exposes one function:
 *                - sendVerificationCode(email, code): sends a 5-digit OTP email
 *
 *              Retry logic: up to 3 attempts with a 2-second delay between
 *              retries to handle transient Gmail SMTP failures.
 *
 *              Required environment variables:
 *                EMAIL_USER — Gmail address used as the sender
 *                EMAIL_PASS — Gmail App Password (not the account password)
 *                             Generate one at: myaccount.google.com/apppasswords
 *
 * @module services/emailService
 */

import nodemailer from "nodemailer";

/**
 * Nodemailer transporter configured for Gmail SMTP.
 * `family: 4` forces IPv4 to avoid connection issues on some Linux hosts.
 * `rejectUnauthorized: false` is acceptable for dev; remove in production.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  family: 4, // force IPv4 — avoids ETIMEDOUT on some networks
} as any);

/**
 * Attempts to send an email up to `retries` times.
 * Waits 2 seconds between each failed attempt before retrying.
 *
 * @param {object} mailOptions - Nodemailer mail options (from, to, subject, html)
 * @param {number} [retries=3] - Maximum number of send attempts
 * @returns {Promise<void>}
 * @throws Will throw after exhausting all retries
 */
async function sendWithRetry(mailOptions: any, retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      return; // success — exit early
    } catch (err: any) {
      console.warn(`Email attempt ${attempt}/${retries} failed: ${err.message}`);

      if (attempt === retries) throw err; // re-throw on final attempt

      // Wait 2 seconds before retrying (simple backoff)
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

/**
 * Sends a 5-digit email verification code to the specified address.
 *
 * Called from:
 *  - authroutes.ts  → signup, login, resend-code
 *  - Oauthroutes.ts → Google/GitHub/LinkedIn callbacks
 *
 * The code expires in 10 minutes (enforced by the caller, not this function).
 *
 * @param {string} email - Recipient's email address
 * @param {string} code  - 5-digit verification code
 * @returns {Promise<void>}
 * @throws Will throw if all send attempts fail
 */
export async function sendVerificationCode(
  email: string,
  code: string
): Promise<void> {
  const mailOptions = {
    from: `"ttwar تتطور" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "كود التحقق — ttwar",
    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 400px;
        margin: auto;
        padding: 24px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        direction: rtl;
      ">
        <h2 style="color: #4f46e5; text-align: center;">تتطور · ttwar</h2>

        <p style="color: #374151;">مرحباً،</p>
        <p style="color: #374151;">كود التحقق الخاص بك هو:</p>

        <!-- Large, visually prominent code display -->
        <div style="text-align: center; margin: 24px 0;">
          <span style="
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #4f46e5;
          ">
            ${code}
          </span>
        </div>

        <p style="color: #6b7280; font-size: 13px;">الكود صالح لمدة 10 دقائق فقط.</p>
        <p style="color: #6b7280; font-size: 13px;">
          إذا لم تطلب هذا الكود، تجاهل هذا الإيميل.
        </p>
      </div>
    `,
  };

  await sendWithRetry(mailOptions);
}