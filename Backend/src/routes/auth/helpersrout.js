/**
 * @fileoverview Authentication Helpers
 * @description Shared helper functions and temporary verification code storage.
 *
 * @module routes/auth/helpers
 */

export const verificationCodes = new Map();

export function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export function normalizeEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    return null;
  }

  return email.trim().toLowerCase();
}