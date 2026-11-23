/**
 * @fileoverview OAuth Routes Loader
 * @description Combines all OAuth route modules.
 *
 * @module routes/oauth
 */

const express = require("express");

const googleRoutes = require("./google.js");
const githubRoutes = require("./github.js");
const linkedinRoutes = require("./linkedin.js");

const router = express.Router();

router.use(googleRoutes);
router.use(githubRoutes);
router.use(linkedinRoutes);

module.exports = router;