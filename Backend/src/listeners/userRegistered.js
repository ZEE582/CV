/**
 * @fileoverview User Registered Listener
 * @description Handles actions triggered after a new user account is created.
 *
 * @module listeners/userRegistered
 */

import userEvents from "../events/userEvents.js";

userEvents.on("userRegistered", (user) => {
  console.log(`[Event] userRegistered — ${user.email}`);
});