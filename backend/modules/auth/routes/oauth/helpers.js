const { issueChallenge } = require('../../services/challenges');
async function issueAndSendCode(user, res) {
  if (!user.is_active) { const error = new Error('الحساب غير متاح'); error.status = 403; throw error; }
  return issueChallenge(user, res);
}
module.exports = { issueAndSendCode };
