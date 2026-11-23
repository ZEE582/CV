const express = require('express');
const Joi = require('joi');
const { validate } = require('../../../../middleware/validate');
const { resendChallenge } = require('../../services/challenges');
const router = express.Router();
router.post('/resend-code', validate(Joi.object({ email: Joi.string().email().trim().lowercase().required() })), async (req, res, next) => {
  try { const result = await resendChallenge(req); res.status(result.status).json({ message: result.message }); }
  catch (error) { next(error); }
});
module.exports = router;
