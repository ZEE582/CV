/**
 * @fileoverview Email Templates
 * @description Contains reusable HTML templates for transactional emails.
 *
 * @module services/email/templates
 */
function verificationCodeTemplate(code) {
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
function passwordResetTemplate(code) {
  return `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:440px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
    <h2>استعادة كلمة المرور — تطوّر</h2><p>أدخل رمز الاستعادة التالي في المتصفح الذي طلبته منه:</p>
    <p dir="ltr" style="font-size:32px;letter-spacing:6px;text-align:center;font-weight:bold">${code}</p>
    <p>الرمز صالح لمدة 10 دقائق ويُستخدم مرة واحدة. لا تشاركه مع أي شخص.</p>
    <p>إذا لم تطلب استعادة كلمة المرور، تجاهل الرسالة. كلمة مرورك الحالية لم تتغير.</p></div>`;
}
module.exports = { verificationCodeTemplate, passwordResetTemplate };
