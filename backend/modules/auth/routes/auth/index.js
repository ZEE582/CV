const express = require('express');
const { rateLimit } = require('express-rate-limit');
function createAuthRouter() {
  const router = express.Router();
  router.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false, message: { message: 'طلبات كثيرة، حاول لاحقًا' } }));
  router.use(require('./signuprout'));
  router.use(require('./loginrout'));
  router.use(require('./verifyCoderout'));
  router.use(require('./resendCoderout'));
  router.use(require('./passwordRecovery')());
  return router;
}
module.exports = createAuthRouter;
