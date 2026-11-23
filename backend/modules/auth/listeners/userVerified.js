/**
 * @fileoverview User Verified Listener
 * @description Handles actions triggered after email verification succeeds.
 *
 * @module listeners/userVerified
 */

const userEvents = require("../events/userEvents.js");

userEvents.on("userVerified", () => {
  console.log('[Event] userVerified');
});
