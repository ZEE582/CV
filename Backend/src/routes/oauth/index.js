/**
 * @fileoverview OAuth Routes Loader
 * @description Combines all OAuth route modules.
 *
 * @module routes/oauth
 */

import express from "express";

import googleRoutes from "./google.js";
import githubRoutes from "./github.js";
import linkedinRoutes from "./linkedin.js";

const router = express.Router();

router.use(googleRoutes);
router.use(githubRoutes);
router.use(linkedinRoutes);

export default router;