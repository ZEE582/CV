/**
 * @fileoverview Questions Completed Listener
 * @description Handles actions triggered after onboarding questions are completed.
 *
 * @module listeners/questionsCompleted
 */

const userEvents = require("../events/userEvents.js");

userEvents.on("questionsCompleted", () => {
  console.log('[Event] questionsCompleted');
});
