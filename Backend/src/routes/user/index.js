/**
 * @fileoverview User Routes Loader
 * @description Combines all user-related routes.
 *
 * @module routes/user
 */

import express from "express";

import questionsRoutes from "./questions.js";
import profileRoutes from "./profile.js";
import scoreRoutes from "./score.js";

const router = express.Router();

router.use(questionsRoutes);
router.use(profileRoutes);
router.use(scoreRoutes);

export default router;