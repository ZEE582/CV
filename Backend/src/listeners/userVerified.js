/**
 * @fileoverview User Verified Listener
 * @description Handles actions triggered after email verification succeeds.
 *
 * @module listeners/userVerified
 */

import userEvents from "../events/userEvents.js";

userEvents.on("userVerified", (user) => {
  console.log(`[Event] userVerified — ${user.email}`);
});