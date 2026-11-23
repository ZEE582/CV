const { sendWithRetry } = require('./retry');
const { verificationCodeTemplate, passwordResetTemplate } = require('./templates');
const { emailConfiguration } = require('./configuration');
function ensureEmailConfigured() {
  return emailConfiguration();
}
async function sendVerificationCode(email, code) {
  const { from } = ensureEmailConfigured();
  await sendWithRetry({ from, to: email, subject: 'كود التحقق — تطوّر', text: `رمز التحقق في تطوّر: ${code}. صالح لمدة 10 دقائق. لا تشاركه مع أي شخص.`, html: verificationCodeTemplate(code) });
}
async function sendPasswordResetCode(email, code) {
  const { from } = ensureEmailConfigured();
  await sendWithRetry({ from, to: email, subject: 'استعادة كلمة المرور — تطوّر', text: `رمز استعادة كلمة المرور في تطوّر: ${code}. صالح لمدة 10 دقائق ويستخدم مرة واحدة. تجاهله إذا لم تطلبه.`, html: passwordResetTemplate(code) });
}
module.exports = { sendVerificationCode, sendPasswordResetCode, ensureEmailConfigured };
