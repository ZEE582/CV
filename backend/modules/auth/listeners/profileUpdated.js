/**
 * @fileoverview Profile Updated Listener
 * @description Handles actions triggered after profile updates.
 *
 * @module listeners/profileUpdated
 */

const userEvents = require("../events/userEvents.js");

userEvents.on("profileUpdated", () => {
  console.log('[Event] profileUpdated');
});
