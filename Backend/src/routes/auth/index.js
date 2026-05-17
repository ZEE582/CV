/**
 * @fileoverview Authentication Routes Loader
 * @description Combines all authentication-related routes.
 *
 * @module routes/auth
 */

import express from "express";

import signupRoute from "./signuprout.js";
import loginRoute from "./loginrout.js";
import verifyCodeRoute from "./verifyCoderout.js";
import resendCodeRoute from "./resendCoderout.js";

const router = express.Router();

router.use(signupRoute);
router.use(loginRoute);
router.use(verifyCodeRoute);
router.use(resendCodeRoute);

export default router;