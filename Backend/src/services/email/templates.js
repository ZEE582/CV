/**
 * @fileoverview Email Templates
 * @description Contains reusable HTML templates for transactional emails.
 *
 * @module services/email/templates
 */
export function verificationCodeTemplate(code) {
  return `
    <div style="
      font-family: Arial, sans-serif;
      max-width: 400px;
      margin: auto;
      padding: 24px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      direction: rtl;
    ">
      <h2 style="color: #4f46e5; text-align: center;">
        تتطور · ttwar
      </h2>

      <p style="color: #374151;">مرحباً،</p>
      <p style="color: #374151;">كود التحقق الخاص بك هو:</p>

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

      <p style="color: #6b7280; font-size: 13px;">
        الكود صالح لمدة 10 دقائق فقط.
      </p>

      <p style="color: #6b7280; font-size: 13px;">
        إذا لم تطلب هذا الكود، تجاهل هذا الإيميل.
      </p>
    </div>
  `;
}