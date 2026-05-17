/**
 * @fileoverview Email Transporter
 * @description Configures Nodemailer Gmail SMTP transporter.
 *
 * @module services/email/transporter
 */

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    rejectUnauthorized: false,
  },

  family: 4,
});

export default transporter;