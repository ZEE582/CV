/**
 * @fileoverview User Registered Listener
 * @description Handles actions triggered after a new user account is created.
 *
 * @module listeners/userRegistered
 */

const userEvents = require("../events/userEvents.js");

userEvents.on("userRegistered", () => {
  console.log('[Event] userRegistered');
});
