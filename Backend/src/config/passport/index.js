/**
 * @fileoverview Passport Strategies Entry Point
 * @description Imports and registers all Passport OAuth strategies.
 *
 *              This file does not define a strategy directly.
 *              It only loads Google, GitHub, and LinkedIn strategy files
 *              so they can be registered on the shared Passport instance.
 *
 * @module config/passport
 */
import dotenv from "dotenv";
dotenv.config();

import passport from "passport";

import "./googlePassport.js";
import "./githubPassport.js";
import "./linkedinPassport.js";

export default passport;