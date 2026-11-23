/**
 * @fileoverview User Routes Loader
 * @description Combines all user-related routes.
 *
 * @module routes/user
 */

const express = require("express");

const questionsRoutes = require("./questions.js");
const profileRoutes = require("./profile.js");
const scoreRoutes = require("./score.js");

const router = express.Router();

router.use(questionsRoutes);
router.use(profileRoutes);
router.use(scoreRoutes);

module.exports = router;