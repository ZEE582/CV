/**
 * @fileoverview Profile Updated Listener
 * @description Handles actions triggered after profile updates.
 *
 * @module listeners/profileUpdated
 */

import userEvents from "../events/userEvents.js";

userEvents.on("profileUpdated", (user) => {
  console.log(`[Event] profileUpdated — ${user.email}`);
});