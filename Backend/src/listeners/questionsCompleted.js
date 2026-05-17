/**
 * @fileoverview Questions Completed Listener
 * @description Handles actions triggered after onboarding questions are completed.
 *
 * @module listeners/questionsCompleted
 */

import userEvents from "../events/userEvents.js";

userEvents.on("questionsCompleted", (user) => {
  console.log(`[Event] questionsCompleted — ${user.email}`);
});